#!/usr/bin/env node
/**
 * Write the production env file for the Windows deploy package.
 * Values come from the process environment. This file does not contain secrets.
 */
import fs from "node:fs";

const target = process.argv[2];
if (!target) {
  console.error("Usage: node scripts/write-deploy-env.mjs <path>");
  process.exit(1);
}

function quote(value) {
  // Quote only. A backslash must stay a single backslash so the instance
  // separator is `VMI3197632\SQLEXPRESS`. Doubling it makes the driver skip
  // the SQLEXPRESS instance.
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function collapseServerBackslashes(value) {
  return String(value).replace(/\\{2,}/g, "\\");
}

function serverName() {
  const configured = process.env.MSSQL_SERVER;
  const instance = process.env.MSSQL_INSTANCE;
  let server = configured ? collapseServerBackslashes(configured) : "VMI3197632\\SQLEXPRESS";
  if (instance && !server.includes("\\")) server = `${server}\\${instance}`;
  return server;
}

function normalizeConnectionString(raw) {
  return String(raw).replace(
    /((?:^|;)\s*(?:server|data source)\s*=\s*)([^;]*)/gi,
    (_match, prefix, value) => `${prefix}${collapseServerBackslashes(value)}`,
  );
}

const password = process.env.MSSQL_PASSWORD ?? "";
const lines = [
  `MSSQL_SERVER=${quote(serverName())}`,
  `MSSQL_DATABASE=${quote(process.env.MSSQL_DATABASE || "YorubaDayCanberra")}`,
  `MSSQL_USER=${quote(process.env.MSSQL_USER || "yorubaday_admin")}`,
  `MSSQL_PASSWORD=${quote(password)}`,
  `MSSQL_ENCRYPT=${quote(process.env.MSSQL_ENCRYPT || "true")}`,
  `MSSQL_TRUST_SERVER_CERTIFICATE=${quote(process.env.MSSQL_TRUST_SERVER_CERTIFICATE || "true")}`,
];

if (process.env.MSSQL_CONNECTION_STRING) {
  lines.unshift(`MSSQL_CONNECTION_STRING=${quote(normalizeConnectionString(process.env.MSSQL_CONNECTION_STRING))}`);
}

lines.push(
  `SESSION_SECRET=${quote(process.env.SESSION_SECRET ?? "")}`,
  `ADMIN_EMAIL=${quote(process.env.ADMIN_EMAIL || "admin@promaxevent.com")}`,
  `ADMIN_FULL_NAME=${quote(process.env.ADMIN_FULL_NAME || "Platform Administrator")}`,
  `ADMIN_PASSWORD=${quote(process.env.ADMIN_PASSWORD ?? "")}`,
  `MAIL_FROM=${quote(process.env.MAIL_FROM || "Promax Event <support@promaxcare.com.au>")}`,
  `MAIL_FROM_NAME=${quote(process.env.MAIL_FROM_NAME || "Promax Event")}`,
  `SMTP_HOST=${quote(process.env.SMTP_HOST || "mail.promaxcare.com.au")}`,
  `SMTP_PORT=${quote(process.env.SMTP_PORT || "587")}`,
  `SMTP_USER=${quote(process.env.SMTP_USER || "support@promaxcare.com.au")}`,
  `SMTP_PASSWORD=${quote(process.env.SMTP_PASSWORD ?? "")}`,
  `EMAIL_CONFIRMATIONS_ENABLED=${quote(process.env.EMAIL_CONFIRMATIONS_ENABLED || "true")}`,
  `PUBLIC_REGISTRATION_OPEN=${quote(process.env.PUBLIC_REGISTRATION_OPEN || "true")}`,
  `SMS_ENABLED=${quote(process.env.SMS_ENABLED || "false")}`,
  `DASHBOARD_AUTH_REQUIRED=${quote(process.env.DASHBOARD_AUTH_REQUIRED || "true")}`,
  `EVENT_SLUG=${quote(process.env.EVENT_SLUG || "yoruba-day-canberra-2026")}`,
  `NODE_ENV="production"`,
);

fs.writeFileSync(target, `${lines.join("\n")}\n`, { mode: 0o600 });
console.info("Wrote server environment to", target);
