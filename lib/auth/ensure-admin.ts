import "server-only";

import { hashPassword } from "@/lib/auth/password";
import { dbOne } from "@/lib/db/query";
import { getDatabaseEnvPresence } from "@/lib/db/connection";

/**
 * Create the committee Super Admin from ADMIN_EMAIL / ADMIN_PASSWORD.
 * An existing password is left unchanged so a restart does not reset it.
 */
export async function ensureCommitteeAdmin(): Promise<"created" | "password-set" | "exists" | "skipped"> {
  const database = getDatabaseEnvPresence();
  const email = (process.env.ADMIN_EMAIL || "admin@promaxevent.com").trim().toLowerCase();
  const fullName = (process.env.ADMIN_FULL_NAME || "Platform Administrator").trim();
  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (!database.ready || password.length < 12) return "skipped";

  const existing = await dbOne<{ id: string; password_hash: string | null }>(
    `SELECT id, password_hash FROM profiles WHERE email = @email`,
    { email },
  );
  if (existing?.password_hash) return "exists";

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
  console.info("[auth] Set initial password for committee Super Admin:", email);
  return "password-set";
}
