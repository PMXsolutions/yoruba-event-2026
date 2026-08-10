import "server-only";

export type EmailTransport = "smtp" | "resend" | "none";

export type EmailEnvPresence = {
  hasResendKey: boolean;
  hasSmtp: boolean;
  hasFromEmail: boolean;
  fromConfigured: boolean;
  transport: EmailTransport;
  /** True when at least one transport + From address are configured. */
  ready: boolean;
  /** Safe diagnostics for ops — never includes secrets. */
  diagnostics: {
    smtpHost: string | null;
    smtpPort: number | null;
    smtpUserDomain: string | null;
    fromDomain: string | null;
    fromHasDisplayName: boolean;
    emailConfirmationsEnabled: boolean;
  };
};

/** Trim and strip a single layer of wrapping quotes (common Vercel paste issue). */
export function cleanEnv(value: string | undefined): string {
  if (typeof value !== "string") return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function nonEmpty(value: string | undefined): boolean {
  return cleanEnv(value).length > 0;
}

function emailDomain(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/[\w.+-]+@([\w.-]+)/);
  return match?.[1]?.toLowerCase() ?? null;
}

function extractEmailAddress(fromHeader: string): string | null {
  const angle = fromHeader.match(/<([^>]+@[^>]+)>/);
  if (angle?.[1]) return angle[1].trim();
  const bare = fromHeader.match(/([\w.+-]+@[\w.-]+)/);
  return bare?.[1]?.trim() ?? null;
}

/**
 * Resolve mail From header.
 * Prefer MAIL_FROM, then compose MAIL_FROM_NAME + SMTP_USER / RESEND_FROM_EMAIL.
 */
export function resolveMailFrom(): string | null {
  const mailFrom = cleanEnv(process.env.MAIL_FROM);
  if (mailFrom) {
    // Allow bare email or "Name <email>" — if MAIL_FROM is a display name only, compose with user.
    if (mailFrom.includes("@")) return mailFrom;
    const address =
      cleanEnv(process.env.SMTP_USER) ||
      cleanEnv(process.env.RESEND_FROM_EMAIL) ||
      cleanEnv(process.env.MAIL_SENDER);
    if (address.includes("@")) return `${mailFrom} <${address}>`;
    return null;
  }

  const fromName = cleanEnv(process.env.MAIL_FROM_NAME) || "Promax Event";
  const address =
    cleanEnv(process.env.SMTP_USER) ||
    cleanEnv(process.env.RESEND_FROM_EMAIL) ||
    cleanEnv(process.env.MAIL_SENDER);
  if (address.includes("@")) return `${fromName} <${address}>`;

  const resendFrom = cleanEnv(process.env.RESEND_FROM_EMAIL);
  if (resendFrom) return resendFrom;

  return null;
}

export function getSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
} | null {
  const host =
    cleanEnv(process.env.SMTP_HOST) ||
    cleanEnv(process.env.SMTPMail) ||
    cleanEnv(process.env.SMTP_MAIL);
  const user = cleanEnv(process.env.SMTP_USER) || cleanEnv(process.env.MAIL_SENDER);
  const password =
    cleanEnv(process.env.SMTP_PASSWORD) || cleanEnv(process.env.SMTP_Password);
  if (!host || !user || !password) return null;

  const portRaw = cleanEnv(process.env.SMTP_PORT);
  const port = portRaw ? Number.parseInt(portRaw, 10) : 587;
  if (!Number.isFinite(port) || port <= 0) return null;

  const secure = cleanEnv(process.env.SMTP_SECURE) === "true" || port === 465;

  return { host, port, user, password, secure };
}

function emailConfirmationsEnabledFromEnv(): boolean {
  const raw = cleanEnv(process.env.EMAIL_CONFIRMATIONS_ENABLED);
  if (!raw) return true;
  const v = raw.toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return true;
}

export function getEmailEnvPresence(): EmailEnvPresence {
  const hasResendKey = nonEmpty(process.env.RESEND_API_KEY);
  const smtp = getSmtpConfig();
  const hasSmtp = smtp !== null;
  const from = resolveMailFrom();
  const hasFromEmail = Boolean(from);

  let transport: EmailTransport = "none";
  if (hasSmtp && hasFromEmail) transport = "smtp";
  else if (hasResendKey && hasFromEmail) transport = "resend";

  return {
    hasResendKey,
    hasSmtp,
    hasFromEmail,
    fromConfigured: hasFromEmail,
    transport,
    ready: transport !== "none",
    diagnostics: {
      smtpHost: smtp?.host ?? null,
      smtpPort: smtp?.port ?? null,
      smtpUserDomain: emailDomain(smtp?.user ?? null),
      fromDomain: emailDomain(from),
      fromHasDisplayName: Boolean(from && from.includes("<")),
      emailConfirmationsEnabled: emailConfirmationsEnabledFromEnv(),
    },
  };
}

/** Safe one-line summary for server logs (no secrets). */
export function emailConfigLogSummary(): string {
  const env = getEmailEnvPresence();
  const d = env.diagnostics;
  return [
    `transport=${env.transport}`,
    `ready=${env.ready}`,
    `confirmationsEnabled=${d.emailConfirmationsEnabled}`,
    `fromDomain=${d.fromDomain ?? "none"}`,
    `smtpHost=${d.smtpHost ?? "none"}`,
    `smtpPort=${d.smtpPort ?? "none"}`,
    `smtpUserDomain=${d.smtpUserDomain ?? "none"}`,
  ].join(" ");
}

export function redactSmtpErrorMessage(message: string): string {
  return message
    .replace(/pass(word)?[=:]\s*\S+/gi, "password=[redacted]")
    .replace(/auth[=:]\s*\S+/gi, "auth=[redacted]")
    .replace(/\b[A-Za-z0-9+/_-]{20,}=\b/g, "[redacted]");
}

export { extractEmailAddress };
