import "server-only";

export type EmailEnvPresence = {
  hasResendKey: boolean;
  hasFromEmail: boolean;
  ready: boolean;
  /** Resolved From header (never log secrets). */
  fromConfigured: boolean;
};

/**
 * Resolve mail from address.
 * Prefer MAIL_FROM, fall back to RESEND_FROM_EMAIL for compatibility.
 */
export function resolveMailFrom(): string | null {
  const mailFrom = process.env.MAIL_FROM?.trim();
  if (mailFrom) return mailFrom;
  const resendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (resendFrom) return resendFrom;
  return null;
}

export function getEmailEnvPresence(): EmailEnvPresence {
  const hasResendKey =
    typeof process.env.RESEND_API_KEY === "string" &&
    process.env.RESEND_API_KEY.trim().length > 0;
  const from = resolveMailFrom();
  const hasFromEmail = Boolean(from);
  return {
    hasResendKey,
    hasFromEmail,
    fromConfigured: hasFromEmail,
    ready: hasResendKey && hasFromEmail,
  };
}
