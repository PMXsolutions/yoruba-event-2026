import "server-only";

import fs from "node:fs";
import path from "node:path";
import { getPool } from "@/lib/db/query";

export function schemaFilePath(): string {
  return path.join(process.cwd(), "sql", "mssql", "001_create_and_migrate.sql");
}

export function splitSqlBatches(script: string): string[] {
  return script
    .split(/^\s*GO\s*$/gim)
    .map((batch) => batch.trim())
    .filter((batch) => batch.replace(/--.*$/gm, "").trim().length > 0);
}

/** Apply the idempotent T-SQL script. Safe to run on every process start. */
export async function applyDatabaseSchema(): Promise<void> {
  const file = schemaFilePath();
  if (!fs.existsSync(file)) {
    throw new Error(`SQL Server schema file is missing at ${file}`);
  }
  const batches = splitSqlBatches(fs.readFileSync(file, "utf8"));
  const pool = await getPool();
  for (const batch of batches) {
    await pool.request().query(batch);
  }
}
