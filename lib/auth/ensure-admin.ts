import "server-only";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { dbOne } from "@/lib/db/query";
import { getDatabaseEnvPresence } from "@/lib/db/connection";

/**
 * Create the committee Super Admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 * The deployment password is the one that signs in. A stored hash that does
 * not match it is replaced on startup, so an earlier failed bootstrap cannot
 * leave the account unreachable.
 */
export async function ensureCommitteeAdmin(): Promise<"created" | "password-set" | "exists" | "skipped"> {
  const database = getDatabaseEnvPresence();
  const email = (process.env.ADMIN_EMAIL || "admin@promaxevent.com").trim().toLowerCase();
  const fullName = (process.env.ADMIN_FULL_NAME || "Platform Administrator").trim();
  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (!database.ready || password.length < 12) {
    console.error(
      "[auth] Super Admin was not created. ADMIN_PASSWORD must be set and at least 12 characters.",
    );
    return "skipped";
  }

  const existing = await dbOne<{
    id: string;
    password_hash: string | null;
    role: string | null;
    is_active: boolean | number | null;
  }>(
    `SELECT id, password_hash, role, is_active FROM profiles WHERE email = @email`,
    { email },
  );
  const active = existing?.is_active === true || existing?.is_active === 1;
  const passwordMatches = Boolean(
    existing?.password_hash && (await verifyPassword(password, existing.password_hash)),
  );
  if (existing && passwordMatches && existing.role === "SUPER_ADMIN" && active) {
    console.info("[auth] Committee Super Admin is ready:", email);
    return "exists";
  }

  const passwordHash = await hashPassword(password);
  if (!existing) {
    await dbOne(
      `INSERT INTO profiles (email, password_hash, full_name, role, is_active)
       OUTPUT INSERTED.id
       VALUES (@email, @passwordHash, @fullName, 'SUPER_ADMIN', 1)`,
      { email, passwordHash, fullName },
    );
    console.info("[auth] Created committee Super Admin:", email);
    return "created";
  }

  await dbOne(
    `UPDATE profiles
     SET password_hash = @passwordHash, full_name = @fullName, role = 'SUPER_ADMIN', is_active = 1, updated_at = SYSDATETIMEOFFSET()
     OUTPUT INSERTED.id
     WHERE id = @id`,
    { id: existing.id, passwordHash, fullName },
  );
  console.info("[auth] Set committee Super Admin password from ADMIN_PASSWORD:", email);
  return "password-set";
}
