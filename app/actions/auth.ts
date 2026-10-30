"use server";

import { issueAccountEmail, tokenHash } from "@/lib/auth/account-email";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { clearSessionCookie, setSessionCookie } from "@/lib/auth/session";
import { dbExec, dbOne } from "@/lib/db/query";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function signIn(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { ok: false, error: "Invalid email or password. Committee access only." };
  }
  if (!checkRateLimit(`login:${normalized}`, 8, 60_000).allowed) {
    return { ok: false, error: "Too many sign-in attempts. Please wait a minute and try again." };
  }

  try {
    const profile = await dbOne<{ id: string; password_hash: string | null; is_active: boolean | number }>(
      `SELECT id, password_hash, is_active FROM profiles WHERE email = @email`,
      { email: normalized },
    );
    const active = profile?.is_active === true || profile?.is_active === 1;
    if (!profile || !active || !(await verifyPassword(password, profile.password_hash))) {
      return { ok: false, error: "Invalid email or password. Committee access only." };
    }
    const saved = await setSessionCookie(profile.id);
    if (!saved) {
      return { ok: false, error: "Sign-in is not configured on this server yet." };
    }
    return { ok: true };
  } catch (error) {
    console.error("[auth] Sign-in failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "Unable to sign in. Please try again." };
  }
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();
}

export async function requestPasswordReset(email: string): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();
  const message = "If an account exists for that email, a reset link has been sent.";
  if (!normalized) return { ok: true, message };
  if (!checkRateLimit(`reset:${normalized}`, 5, 60_000).allowed) {
    return { ok: false, error: "Please wait a minute before requesting another reset email." };
  }

  try {
    const profile = await dbOne<{ id: string; is_active: boolean | number }>(
      `SELECT id, is_active FROM profiles WHERE email = @email`,
      { email: normalized },
    );
    const active = profile?.is_active === true || profile?.is_active === 1;
    if (profile && active) {
      await issueAccountEmail({
        profileId: profile.id,
        email: normalized,
        purpose: "recovery",
        subject: "Reset your committee portal password — Yoruba Day Canberra",
        intro: "A password reset was requested for your committee portal account.",
      });
    }
  } catch (error) {
    console.error("[auth] Password reset failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "Unable to send reset email. Please try again or contact your administrator." };
  }
  return { ok: true, message };
}

export async function completePasswordSetup(input: {
  token: string;
  password: string;
}): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const token = input.token.trim();
  if (input.password.length < 12) {
    return { ok: false, error: "Password could not be saved. Use at least 12 characters and try again." };
  }
  if (!token) {
    return { ok: false, error: "This setup link is invalid or expired. Ask your administrator to resend it." };
  }

  try {
    const row = await dbOne<{ profile_id: string; expires_at: string | Date; used_at: string | Date | null }>(
      `SELECT profile_id, expires_at, used_at FROM account_tokens WHERE token_hash = @tokenHash`,
      { tokenHash: tokenHash(token) },
    );
    const expires = row ? new Date(row.expires_at).getTime() : 0;
    if (!row || row.used_at || expires < Date.now()) {
      return { ok: false, error: "This link is invalid or expired. Ask for a new setup email." };
    }
    const passwordHash = await hashPassword(input.password);
    await dbExec(
      `UPDATE profiles SET password_hash = @passwordHash, updated_at = SYSDATETIMEOFFSET() WHERE id = @id`,
      { id: row.profile_id, passwordHash },
    );
    await dbExec(
      `UPDATE account_tokens SET used_at = SYSDATETIMEOFFSET() WHERE token_hash = @tokenHash AND used_at IS NULL`,
      { tokenHash: tokenHash(token) },
    );
    return { ok: true, message: "Password saved. You can now sign in." };
  } catch (error) {
    console.error("[auth] Password setup failed:", error instanceof Error ? error.message : error);
    return { ok: false, error: "Unable to save your password. Please try again." };
  }
}

