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
};

function nonEmpty(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Resolve mail From header.
 * Prefer MAIL_FROM, then compose MAIL_FROM_NAME + SMTP_USER / RESEND_FROM_EMAIL.
 */
export function resolveMailFrom(): string | null {
  const mailFrom = process.env.MAIL_FROM?.trim();
  if (mailFrom) {
    // Allow bare email or "Name <email>" — if MAIL_FROM is a display name only, compose with user.
    if (mailFrom.includes("@")) return mailFrom;
    const address =
      process.env.SMTP_USER?.trim() ||
      process.env.RESEND_FROM_EMAIL?.trim() ||
      process.env.MAIL_SENDER?.trim();
    if (address?.includes("@")) return `${mailFrom} <${address}>`;
    return null;
  }

  const fromName = process.env.MAIL_FROM_NAME?.trim() || "Promax Event";
  const address =
    process.env.SMTP_USER?.trim() ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.MAIL_SENDER?.trim();
  if (address?.includes("@")) return `${fromName} <${address}>`;

  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
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
    process.env.SMTP_HOST?.trim() || process.env.SMTPMail?.trim() || process.env.SMTP_MAIL?.trim();
  const user =
    process.env.SMTP_USER?.trim() ||
    process.env.MAIL_SENDER?.trim();
  const password =
    process.env.SMTP_PASSWORD?.trim() || process.env.SMTP_Password?.trim();
  if (!host || !user || !password) return null;

  const portRaw = process.env.SMTP_PORT?.trim();
  const port = portRaw ? Number.parseInt(portRaw, 10) : 587;
  if (!Number.isFinite(port) || port <= 0) return null;

  const secure =
    process.env.SMTP_SECURE === "true" || port === 465;

  return { host, port, user, password, secure };
}

export function getEmailEnvPresence(): EmailEnvPresence {
  const hasResendKey = nonEmpty(process.env.RESEND_API_KEY);
  const hasSmtp = getSmtpConfig() !== null;
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
  };
}
