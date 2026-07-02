/**
 * Twilio SMS foundation — types and env check only (no sends in v1).
 * See docs/SMS.md for activation steps.
 */

export type SmsEnvPresence = {
  hasAccountSid: boolean;
  hasAuthToken: boolean;
  hasFromNumber: boolean;
  ready: boolean;
};

export function getSmsEnvPresence(): SmsEnvPresence {
  const hasAccountSid =
    typeof process.env.TWILIO_ACCOUNT_SID === "string" &&
    process.env.TWILIO_ACCOUNT_SID.trim().length > 0;
  const hasAuthToken =
    typeof process.env.TWILIO_AUTH_TOKEN === "string" &&
    process.env.TWILIO_AUTH_TOKEN.trim().length > 0;
  const hasFromNumber =
    typeof process.env.TWILIO_FROM_NUMBER === "string" &&
    process.env.TWILIO_FROM_NUMBER.trim().length > 0;
  return {
    hasAccountSid,
    hasAuthToken,
    hasFromNumber,
    ready: hasAccountSid && hasAuthToken && hasFromNumber,
  };
}

export type SmsMessage = {
  to: string;
  body: string;
  eventSlug: string;
};

/** Future: implement in platform/engines/notifications/sms/twilio-client.ts */
export type SmsProvider = {
  send(message: SmsMessage): Promise<{ ok: boolean; sid?: string }>;
};
