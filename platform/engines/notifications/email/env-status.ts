import "server-only";

export type EmailEnvPresence = {
  hasResendKey: boolean;
  hasFromEmail: boolean;
  ready: boolean;
};

export function getEmailEnvPresence(): EmailEnvPresence {
  const hasResendKey =
    typeof process.env.RESEND_API_KEY === "string" &&
    process.env.RESEND_API_KEY.trim().length > 0;
  const hasFromEmail =
    typeof process.env.RESEND_FROM_EMAIL === "string" &&
    process.env.RESEND_FROM_EMAIL.trim().length > 0;
  return { hasResendKey, hasFromEmail, ready: hasResendKey && hasFromEmail };
}
