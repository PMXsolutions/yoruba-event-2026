function clean(value) {
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

function flag(value, fallback) {
  const raw = clean(value).toLowerCase();
  if (!raw) return fallback;
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

function splitServerTarget(raw) {
  let server = String(raw).trim().replace(/\\{2,}/g, "\\");
  let instanceName;
  let port;
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

function parseConnectionString(raw) {
  const map = new Map();
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

function getSettings() {
  const combined = clean(process.env.MSSQL_CONNECTION_STRING);
  if (combined) return parseConnectionString(combined);
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

const LOCAL_SQL_HOSTS = new Set(["vmi3197632", "localhost", "127.0.0.1", ".", "(local)"]);

function dialHost(server, instanceName) {
  if (instanceName && LOCAL_SQL_HOSTS.has(String(server).trim().toLowerCase())) return "127.0.0.1";
  return server;
}

function tlsServerName(server) {
  const host = String(server).trim();
  const lower = host.toLowerCase();
  if (lower === "localhost" || lower === "." || lower === "(local)" || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) {
    return "localhost";
  }
  return host;
}

function toDriverConfig(settings) {
  const server = dialHost(settings.server, settings.instanceName);
  return {
    server,
    port: settings.instanceName ? undefined : settings.port,
    database: settings.database,
    user: settings.user,
    password: settings.password,
    connectionTimeout: 30000,
    requestTimeout: 60000,
    options: {
      instanceName: settings.instanceName,
      serverName: server === "127.0.0.1" ? tlsServerName(settings.server) : undefined,
      encrypt: settings.encrypt,
      trustServerCertificate: settings.trustServerCertificate,
      enableArithAbort: true,
    },
  };
}

module.exports = { getSettings, parseConnectionString, toDriverConfig };
