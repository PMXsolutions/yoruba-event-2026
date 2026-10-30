/**
 * ADO.NET-style SQL Server settings. Values are read from the environment.
 * The password is never logged and is never stored in source control.
 */

export type MssqlConnectionSettings = {
  server: string;
  instanceName?: string;
  port?: number;
  database: string;
  user: string;
  password: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
};

function clean(value: string | undefined): string {
  if (typeof value !== "string") return "";
  let next = value.trim();
  if (
    (next.startsWith('"') && next.endsWith('"') && next.length >= 2) ||
    (next.startsWith("'") && next.endsWith("'") && next.length >= 2)
  ) {
    next = next.slice(1, -1).trim();
  }
  return next;
}

function flag(value: string | undefined, fallback: boolean): boolean {
  const raw = clean(value).toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

/** Parse `Server=host\\INSTANCE;Database=...;User Id=...;Password=...`. */
export function parseMssqlConnectionString(raw: string): MssqlConnectionSettings | null {
  const map = new Map<string, string>();
  for (const part of raw.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;
    map.set(trimmed.slice(0, separator).trim().toLowerCase(), trimmed.slice(separator + 1).trim());
  }

  const serverRaw = map.get("server") || map.get("data source") || "";
  const database = map.get("database") || map.get("initial catalog") || "";
  const user = map.get("user id") || map.get("uid") || map.get("user") || "";
  const password = map.get("password") || map.get("pwd") || "";
  if (!serverRaw || !database || !user || !password) return null;

  let server = serverRaw;
  let instanceName: string | undefined;
  let port: number | undefined;
  if (server.includes("\\")) {
    const [host, instance] = server.split("\\");
    server = host;
    instanceName = instance || undefined;
  }
  if (server.includes(",")) {
    const [host, portText] = server.split(",");
    server = host;
    const parsed = Number.parseInt(portText, 10);
    if (Number.isFinite(parsed)) port = parsed;
  }

  return {
    server,
    instanceName,
    port,
    database,
    user,
    password,
    encrypt: flag(map.get("encrypt"), true),
    trustServerCertificate: flag(map.get("trustservercertificate"), true),
  };
}

export function getMssqlConnectionSettings(): MssqlConnectionSettings | null {
  const combined = clean(process.env.MSSQL_CONNECTION_STRING);
  if (combined) return parseMssqlConnectionString(combined);

  const server = clean(process.env.MSSQL_SERVER);
  const database = clean(process.env.MSSQL_DATABASE);
  const user = clean(process.env.MSSQL_USER);
  const password = clean(process.env.MSSQL_PASSWORD);
  if (!server || !database || !user || !password) return null;

  const instanceName = clean(process.env.MSSQL_INSTANCE) || undefined;
  const portText = clean(process.env.MSSQL_PORT);
  const port = portText ? Number.parseInt(portText, 10) : undefined;

  return {
    server,
    instanceName,
    port: Number.isFinite(port) ? port : undefined,
    database,
    user,
    password,
    encrypt: flag(process.env.MSSQL_ENCRYPT, true),
    trustServerCertificate: flag(process.env.MSSQL_TRUST_SERVER_CERTIFICATE, true),
  };
}

export type DatabaseEnvPresence = {
  ready: boolean;
  /** Session signing secret is present. Login cannot succeed without it. */
  authReady: boolean;
  server: string | null;
  database: string | null;
};

export function getDatabaseEnvPresence(): DatabaseEnvPresence {
  const settings = getMssqlConnectionSettings();
  const sessionSecret = clean(process.env.SESSION_SECRET);
  return {
    ready: settings !== null,
    authReady: sessionSecret.length >= 32,
    server: settings?.server ?? null,
    database: settings?.database ?? null,
  };
}

export function missingDatabaseEnvVarNames(): string[] {
  if (clean(process.env.MSSQL_CONNECTION_STRING)) {
    return getMssqlConnectionSettings() ? [] : ["MSSQL_CONNECTION_STRING"];
  }
  const missing: string[] = [];
  if (!clean(process.env.MSSQL_SERVER)) missing.push("MSSQL_SERVER");
  if (!clean(process.env.MSSQL_DATABASE)) missing.push("MSSQL_DATABASE");
  if (!clean(process.env.MSSQL_USER)) missing.push("MSSQL_USER");
  if (!clean(process.env.MSSQL_PASSWORD)) missing.push("MSSQL_PASSWORD");
  return missing;
}
