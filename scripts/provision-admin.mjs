#!/usr/bin/env node
/**
 * Create or complete the committee Super Admin in SQL Server.
 *
 *   npm run provision-admin
 *
 * Required: MSSQL connection settings and ADMIN_PASSWORD (min 12 characters).
 * Optional: ADMIN_EMAIL (default admin@promaxevent.com), ADMIN_FULL_NAME.
 * A stored password that does not match ADMIN_PASSWORD is replaced.
 */

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sql = require("mssql");
const { getSettings, toDriverConfig } = require("./mssql-config.cjs");
const { hashPassword, verifyPassword } = require("./password.cjs");

async function main() {
  const settings = getSettings();
  const email = (process.env.ADMIN_EMAIL || "admin@promaxevent.com").trim().toLowerCase();
  const fullName = (process.env.ADMIN_FULL_NAME || "Platform Administrator").trim();
  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";

  if (!settings) {
    console.error("Set MSSQL_CONNECTION_STRING or MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, and MSSQL_PASSWORD.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("Set ADMIN_PASSWORD to a strong password (min 12 characters).");
    process.exit(1);
  }

  const pool = await sql.connect(toDriverConfig(settings));
  try {
    const existing = await pool.request().input("email", sql.NVarChar(320), email).query(
      `SELECT id, password_hash, role, is_active FROM profiles WHERE email = @email`,
    );
    const row = existing.recordset[0];
    const active = row?.is_active === true || row?.is_active === 1;
    if (
      row?.password_hash &&
      active &&
      row.role === "SUPER_ADMIN" &&
      (await verifyPassword(password, row.password_hash))
    ) {
      console.info("SUPER_ADMIN password already matches ADMIN_PASSWORD:", email);
      console.info("Sign in at /login.");
      return;
    }
    const passwordHash = await hashPassword(password);
    if (!row) {
      await pool
        .request()
        .input("email", sql.NVarChar(320), email)
        .input("passwordHash", sql.NVarChar(500), passwordHash)
        .input("fullName", sql.NVarChar(200), fullName)
        .query(
          `INSERT INTO profiles (email, password_hash, full_name, role, is_active)
           VALUES (@email, @passwordHash, @fullName, N'SUPER_ADMIN', 1)`,
        );
      console.info("Created SUPER_ADMIN:", email);
    } else {
      await pool
        .request()
        .input("id", sql.UniqueIdentifier, row.id)
        .input("passwordHash", sql.NVarChar(500), passwordHash)
        .input("fullName", sql.NVarChar(200), fullName)
        .query(
          `UPDATE profiles
           SET password_hash = @passwordHash, full_name = @fullName, role = N'SUPER_ADMIN', is_active = 1
           WHERE id = @id`,
        );
      console.info("Set SUPER_ADMIN password:", email);
    }
    console.info("Password source: ADMIN_PASSWORD (not printed)");
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
