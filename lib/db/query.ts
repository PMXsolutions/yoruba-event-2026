import "server-only";

import sql from "mssql";
import { getMssqlConnectionSettings } from "@/lib/db/connection";
import { isUuid } from "@/lib/db/values";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

export function resetPoolForTests(): void {
  poolPromise = null;
}

function bind(request: sql.Request, params: Record<string, unknown>) {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (typeof value === "string" && isUuid(value)) {
      request.input(key, sql.UniqueIdentifier, value);
      continue;
    }
    if (typeof value === "boolean") {
      request.input(key, sql.Bit, value);
      continue;
    }
    if (typeof value === "number") {
      if (Number.isInteger(value)) request.input(key, sql.Int, value);
      else request.input(key, sql.Float, value);
      continue;
    }
    if (value instanceof Date) {
      request.input(key, sql.DateTimeOffset, value);
      continue;
    }
    request.input(key, sql.NVarChar(sql.MAX), value === null ? null : String(value));
  }
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const settings = getMssqlConnectionSettings();
    if (!settings) {
      throw new Error("Missing MSSQL connection settings.");
    }
    const config: sql.config = {
      server: settings.server,
      port: settings.instanceName ? undefined : settings.port,
      database: settings.database,
      user: settings.user,
      password: settings.password,
      connectionTimeout: 30_000,
      requestTimeout: 30_000,
      pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
      options: {
        instanceName: settings.instanceName,
        encrypt: settings.encrypt,
        trustServerCertificate: settings.trustServerCertificate,
        enableArithAbort: true,
      },
    };
    const created = new sql.ConnectionPool(config);
    poolPromise = created.connect().catch((error: unknown) => {
      poolPromise = null;
      throw error;
    });
  }
  return poolPromise;
}

export async function dbQuery<T extends object>(
  text: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const pool = await getPool();
  const request = pool.request();
  bind(request, params);
  const result = await request.query<T>(text);
  return result.recordset ?? [];
}

export async function dbOne<T extends object>(
  text: string,
  params: Record<string, unknown> = {},
): Promise<T | null> {
  const rows = await dbQuery<T>(text, params);
  return rows[0] ?? null;
}

export async function dbExec(text: string, params: Record<string, unknown> = {}): Promise<number> {
  const pool = await getPool();
  const request = pool.request();
  bind(request, params);
  const result = await request.query(text);
  return result.rowsAffected.reduce((sum, count) => sum + count, 0);
}

export async function dbTransaction<T>(
  run: (query: <R extends object>(text: string, params?: Record<string, unknown>) => Promise<R[]>) => Promise<T>,
): Promise<T> {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const query = async <R extends object>(text: string, params: Record<string, unknown> = {}) => {
      const request = new sql.Request(transaction);
      bind(request, params);
      const result = await request.query<R>(text);
      return result.recordset ?? [];
    };
    const value = await run(query);
    await transaction.commit();
    return value;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
