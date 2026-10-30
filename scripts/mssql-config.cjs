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
  let server = serverRaw;
  let instanceName;
  let port;
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

function getSettings() {
  const combined = clean(process.env.MSSQL_CONNECTION_STRING);
  if (combined) return parseConnectionString(combined);
  const server = clean(process.env.MSSQL_SERVER);
  const database = clean(process.env.MSSQL_DATABASE);
  const user = clean(process.env.MSSQL_USER);
  const password = clean(process.env.MSSQL_PASSWORD);
  if (!server || !database || !user || !password) return null;
  const portText = clean(process.env.MSSQL_PORT);
  const port = portText ? Number.parseInt(portText, 10) : undefined;
  return {
    server,
    instanceName: clean(process.env.MSSQL_INSTANCE) || undefined,
    port: Number.isFinite(port) ? port : undefined,
    database,
    user,
    password,
    encrypt: flag(process.env.MSSQL_ENCRYPT, true),
    trustServerCertificate: flag(process.env.MSSQL_TRUST_SERVER_CERTIFICATE, true),
  };
}

function toDriverConfig(settings) {
  return {
    server: settings.server,
    port: settings.instanceName ? undefined : settings.port,
    database: settings.database,
    user: settings.user,
    password: settings.password,
    connectionTimeout: 30000,
    requestTimeout: 60000,
    options: {
      instanceName: settings.instanceName,
      encrypt: settings.encrypt,
      trustServerCertificate: settings.trustServerCertificate,
      enableArithAbort: true,
    },
  };
}

module.exports = { getSettings, parseConnectionString, toDriverConfig };
