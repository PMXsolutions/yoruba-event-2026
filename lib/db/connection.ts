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

/**
 * The named instance is `VMI3197632\SQLEXPRESS` — one backslash.
 * A doubled separator is collapsed so the instance is still SQLEXPRESS.
 *
 * SQL Server Management Studio opens that name through shared memory.
 * The Node driver only speaks TCP, and from this PC the computer name
 * resolves off the machine, which SQL Express rejects. The socket therefore
 * stays on 127.0.0.1. TLS still has to use the computer name: Node rejects
 * an IP address as a TLS server name.
 */
const LOCAL_SQL_HOSTS = new Set(["vmi3197632", "localhost", "127.0.0.1", ".", "(local)"]);

/** TCP destination. Local instance names are opened on this PC, not via the computer name. */
export function sqlDialHost(server: string, instanceName?: string): string {
  if (instanceName && LOCAL_SQL_HOSTS.has(server.trim().toLowerCase())) return "127.0.0.1";
  return server;
}

/** Hostname sent during TLS. An IP address is not a legal TLS server name. */
export function sqlTlsServerName(server: string): string {
  const host = server.trim();
  const lower = host.toLowerCase();
  if (lower === "localhost" || lower === "." || lower === "(local)" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    return "localhost";
  }
  return host;
}

/** Read `reg query` output for `Instance Names\SQL`. */
export function parseSqlInstanceId(regOutput: string, instance: string): string | undefined {
  const match = new RegExp(`^\\s*${instance}\\s+REG_\\w+\\s+(\\S+)\\s*$`, "im").exec(regOutput);
  return match?.[1];
}

/**
 * A configured TCP Port wins. Otherwise the dynamic port SQL Server is
 * listening on is used. A blank value means TCP/IP has no port yet.
 */
export function parseSqlInstancePort(regOutput: string): number | undefined {
  const fixed = /^\s*TcpPort\s+REG_\w+\s+(\d+)\s*$/im.exec(regOutput);
  const dynamic = /^\s*TcpDynamicPorts\s+REG_\w+\s+(\d+)\s*$/im.exec(regOutput);
  const fixedPort = fixed ? Number.parseInt(fixed[1], 10) : 0;
  const dynamicPort = dynamic ? Number.parseInt(dynamic[1], 10) : 0;
  if (fixedPort > 0) return fixedPort;
  if (dynamicPort > 0) return dynamicPort;
  return undefined;
}

/** Split `host\INSTANCE` or `host,port`. A doubled backslash is collapsed to one. */
export function splitServerTarget(raw: string): { server: string; instanceName?: string; port?: number } {
  let server = raw.trim().replace(/\\{2,}/g, "\\");
  let instanceName: string | undefined;
  let port: number | undefined;

  const slash = server.indexOf("\\");
  if (slash >= 0) {
    const rest = server.slice(slash + 1);
    server = server.slice(0, slash);
    const instanceComma = rest.indexOf(",");
    if (instanceComma >= 0) {
      instanceName = rest.slice(0, instanceComma) || undefined;
      const parsed = Number.parseInt(rest.slice(instanceComma + 1), 10);
      if (Number.isFinite(parsed)) port = parsed;
    } else {
      instanceName = rest || undefined;
    }
  }

  const comma = server.indexOf(",");
  if (comma >= 0) {
    const parsed = Number.parseInt(server.slice(comma + 1), 10);
    server = server.slice(0, comma);
    if (Number.isFinite(parsed)) port = parsed;
  }

  return { server, instanceName, port };
}

/** Parse `Server=127.0.0.1\SQLEXPRESS;Database=...;User Id=...;Password=...`. */
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

  const target = splitServerTarget(serverRaw);
  return {
    server: target.server,
    instanceName: target.instanceName,
    port: target.port,
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

  const target = splitServerTarget(server);
  const portText = clean(process.env.MSSQL_PORT);
  const portFromEnv = portText ? Number.parseInt(portText, 10) : undefined;

  return {
    server: target.server,
    instanceName: target.instanceName || clean(process.env.MSSQL_INSTANCE) || undefined,
    port: target.port ?? (Number.isFinite(portFromEnv) ? portFromEnv : undefined),
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
  const server = settings
    ? settings.instanceName
      ? `${settings.server}\\${settings.instanceName}`
      : settings.server
    : null;
  return {
    ready: settings !== null,
    authReady: sessionSecret.length >= 32,
    server,
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
