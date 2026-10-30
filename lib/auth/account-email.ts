import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { dbExec } from "@/lib/db/query";
import { sendViaSmtp } from "@/platform/engines/notifications/email/smtp-client";

export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;
  return "https://yorubadaycanberra.org";
}

export async function issueAccountEmail(input: {
  profileId: string;
  email: string;
  purpose: "invite" | "recovery";
  subject: string;
  intro: string;
}): Promise<{ ok: boolean }> {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  await dbExec(
    `INSERT INTO account_tokens (profile_id, token_hash, purpose, expires_at)
     VALUES (@profileId, @tokenHash, @purpose, @expires)`,
    {
      profileId: input.profileId,
      tokenHash: tokenHash(token),
      purpose: input.purpose,
      expires,
    },
  );
  const link = new URL("/account/setup", await siteOrigin());
  link.hash = new URLSearchParams({ token }).toString();
  const href = link.toString();
  const result = await sendViaSmtp({
    to: input.email,
    subject: input.subject,
    text: `${input.intro}\n\nSet your password using this one-time link:\n${href}\n\nIf the link has expired, ask your administrator to resend it. If you did not expect this email, ignore it.`,
    html: `<p>${input.intro}</p><p><a href="${href.replaceAll("&", "&amp;")}">Set your password</a></p><p>This link can be used once and expires in 48 hours. If you did not expect this email, ignore it.</p>`,
  });
  return { ok: result.ok };
}
