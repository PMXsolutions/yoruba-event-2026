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
  return `"${String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

const password = process.env.MSSQL_PASSWORD ?? "";
const connection =
  process.env.MSSQL_CONNECTION_STRING ||
  `Server=VMI3197632\\SQLEXPRESS;Database=YorubaDayCanberra;User Id=yorubaday_admin;Password=${password};Encrypt=true;TrustServerCertificate=true;`;

const lines = [
  `MSSQL_CONNECTION_STRING=${quote(connection)}`,
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
];

fs.writeFileSync(target, `${lines.join("\n")}\n`, { mode: 0o600 });
console.info("Wrote server environment to", target);
