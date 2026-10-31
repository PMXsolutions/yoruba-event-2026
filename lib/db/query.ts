import "server-only";

import { execFileSync } from "node:child_process";
import sql from "mssql";
import {
  getMssqlConnectionSettings,
  parseSqlInstanceId,
  parseSqlInstancePort,
  sqlDialHost,
  sqlTlsServerName,
  type MssqlConnectionSettings,
} from "@/lib/db/connection";
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

function localInstanceTcpPort(instanceName: string): number | undefined {
  if (process.platform !== "win32") return undefined;
  try {
    const names = execFileSync(
      "reg",
      ["query", "HKLM\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\Instance Names\\SQL", "/v", instanceName],
      { encoding: "utf8", timeout: 5_000, windowsHide: true },
    );
    const instanceId = parseSqlInstanceId(names, instanceName);
    if (!instanceId) return undefined;
    const ipAll = execFileSync(
      "reg",
      [
        "query",
        `HKLM\\SOFTWARE\\Microsoft\\Microsoft SQL Server\\${instanceId}\\MSSQLServer\\SuperSocketNetLib\\Tcp\\IPAll`,
      ],
      { encoding: "utf8", timeout: 5_000, windowsHide: true },
    );
    return parseSqlInstancePort(ipAll);
  } catch {
    return undefined;
  }
}

function connectionTarget(settings: MssqlConnectionSettings): {
  server: string;
  port?: number;
  instanceName?: string;
  tlsServerName?: string;
} {
  const server = sqlDialHost(settings.server, settings.instanceName);
  const tlsServerName = server === "127.0.0.1" ? sqlTlsServerName(settings.server) : undefined;
  if (settings.port) return { server, port: settings.port, tlsServerName };
  if (!settings.instanceName) return { server, tlsServerName };
  const local = server === "127.0.0.1" ? localInstanceTcpPort(settings.instanceName) : undefined;
  if (local) return { server, port: local, tlsServerName };
  return { server, instanceName: settings.instanceName, tlsServerName };
}

function connectionFailure(error: unknown, target: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/servername|tls/i.test(message) || !/failed to connect|timed out|timeout|could not connect/i.test(message)) {
    return error instanceof Error ? error : new Error(message);
  }
  return new Error(
    `${message} In SQL Server Configuration Manager, enable TCP/IP for SQLEXPRESS, start SQL Server Browser, then restart SQL Server (SQLEXPRESS). The site connects to ${target} on this PC.`,
  );
}

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    const settings = getMssqlConnectionSettings();
    if (!settings) {
      throw new Error("Missing MSSQL connection settings.");
    }
    const target = connectionTarget(settings);
    const instanceLabel = settings.instanceName ? `${settings.server}\\${settings.instanceName}` : settings.server;
    const socketLabel = target.port
      ? `${target.server}:${target.port}`
      : target.instanceName
        ? `${target.server}\\${target.instanceName}`
        : target.server;
    console.info(`[mssql] Connecting to ${instanceLabel} via ${socketLabel} database ${settings.database}`);
    const config: sql.config = {
      server: target.server,
      port: target.port,
      database: settings.database,
      user: settings.user,
      password: settings.password,
      connectionTimeout: 30_000,
      requestTimeout: 30_000,
      pool: { max: 10, min: 0, idleTimeoutMillis: 30_000 },
      options: {
        instanceName: target.instanceName,
        serverName: target.tlsServerName,
        encrypt: settings.encrypt,
        trustServerCertificate: settings.trustServerCertificate,
        enableArithAbort: true,
      },
    };
    const created = new sql.ConnectionPool(config);
    poolPromise = created.connect().catch((error: unknown) => {
      poolPromise = null;
      throw connectionFailure(error, instanceLabel);
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
