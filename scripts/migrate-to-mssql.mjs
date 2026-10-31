#!/usr/bin/env node
/**
 * Apply sql/mssql/001_create_and_migrate.sql, copy rows from Supabase when
 * the old environment variables are still set, then ensure the committee admin.
 *
 *   npm run db:migrate
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sql = require("mssql");
const { getSettings, toDriverConfig } = require("./mssql-config.cjs");
const { hashPassword, verifyPassword } = require("./password.cjs");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaFile = path.join(root, "sql", "mssql", "001_create_and_migrate.sql");

const COPY_ORDER = [
  "events",
  "profiles",
  "rsvps",
  "sponsors",
  "volunteers",
  "tasks",
  "programme_items",
  "announcements",
  "activity_logs",
];

function batches(script) {
  return script
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter((batch) => batch.replace(/--.*$/gm, "").trim().length > 0);
}

async function applySchema(pool) {
  const script = fs.readFileSync(schemaFile, "utf8");
  for (const batch of batches(script)) {
    await pool.request().query(batch);
  }
  console.info("Applied", schemaFile);
}

async function supabaseRows(table) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!base || !key) return null;
  const rows = [];
  for (let offset = 0; offset < 50_000; offset += 1000) {
    const response = await fetch(`${base}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Range: `${offset}-${offset + 999}`,
      },
    });
    if (response.status === 404 || response.status === 416) break;
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase ${table} returned ${response.status}: ${body.slice(0, 200)}`);
    }
    const page = await response.json();
    if (!Array.isArray(page) || page.length === 0) break;
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

function sqlValue(value) {
  if (value == null) return null;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

async function copyTable(pool, table, rows, profileIds) {
  if (!rows?.length) {
    console.info(`No source rows for ${table}.`);
    return;
  }
  let inserted = 0;
  for (const row of rows) {
    if (!row.id) continue;
    const exists = await pool.request().input("id", sql.UniqueIdentifier, row.id).query(
      `SELECT 1 AS found FROM ${table} WHERE id = @id`,
    );
    if (exists.recordset.length > 0) continue;

    const payload = { ...row };
    delete payload.password_hash;
    for (const key of ["assigned_to", "created_by", "actor_id"]) {
      if (payload[key] && profileIds && !profileIds.has(payload[key])) payload[key] = null;
    }
    const columns = Object.keys(payload).filter((key) => /^[a-z0-9_]+$/i.test(key));
    const request = pool.request();
    columns.forEach((column, index) => {
      const value = sqlValue(payload[column]);
      if (typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        request.input(`p${index}`, sql.UniqueIdentifier, value);
      } else if (typeof value === "boolean") {
        request.input(`p${index}`, sql.Bit, value);
      } else if (typeof value === "number" && Number.isInteger(value)) {
        request.input(`p${index}`, sql.Int, value);
      } else if (value === null) {
        request.input(`p${index}`, sql.NVarChar(sql.MAX), null);
      } else {
        request.input(`p${index}`, sql.NVarChar(sql.MAX), String(value));
      }
    });
    const names = columns.map((column) => `[${column}]`).join(", ");
    const values = columns.map((_, index) => `@p${index}`).join(", ");
    await request.query(`INSERT INTO ${table} (${names}) VALUES (${values})`);
    inserted += 1;
    if (table === "profiles") profileIds.add(row.id);
  }
  console.info(`Copied ${inserted} new ${table} row(s); ${rows.length - inserted} already present.`);
}

async function ensureAdmin(pool) {
  const email = (process.env.ADMIN_EMAIL || "admin@promaxevent.com").trim().toLowerCase();
  const fullName = (process.env.ADMIN_FULL_NAME || "Platform Administrator").trim();
  const password = process.env.ADMIN_PASSWORD?.trim() ?? "";
  if (password.length < 12) {
    console.info("ADMIN_PASSWORD is unset or shorter than 12 characters. Super Admin was not created.");
    return;
  }
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
    console.info("Super Admin password already matches ADMIN_PASSWORD:", email);
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
    console.info("Created Super Admin:", email);
    return;
  }
  await pool
    .request()
    .input("id", sql.UniqueIdentifier, row.id)
    .input("passwordHash", sql.NVarChar(500), passwordHash)
    .input("fullName", sql.NVarChar(200), fullName)
    .query(
      `UPDATE profiles
       SET password_hash = @passwordHash, full_name = @fullName, role = N'SUPER_ADMIN', is_active = 1, updated_at = SYSDATETIMEOFFSET()
       WHERE id = @id`,
    );
  console.info("Set initial Super Admin password:", email);
}

async function main() {
  const settings = getSettings();
  if (!settings) {
    console.error("Set MSSQL_CONNECTION_STRING or MSSQL_SERVER, MSSQL_DATABASE, MSSQL_USER, and MSSQL_PASSWORD.");
    process.exit(1);
  }
  const pool = await sql.connect(toDriverConfig(settings));
  try {
    await applySchema(pool);
    const profileIds = new Set();
    const existingProfiles = await pool.request().query(`SELECT id FROM profiles`);
    for (const row of existingProfiles.recordset) profileIds.add(String(row.id));

    const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!supabaseConfigured) {
      console.info("Supabase source is not configured. Event seed is in the schema script. No further rows were copied.");
    } else {
      for (const table of COPY_ORDER) {
        const rows = await supabaseRows(table);
        await copyTable(pool, table, rows, profileIds);
      }
    }
    await ensureAdmin(pool);
    const target = settings.instanceName ? `${settings.server}\\${settings.instanceName}` : settings.server;
    console.info("SQL Server migration finished for database", settings.database, "on", target);
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
