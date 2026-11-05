/**
 * DirectSMS recipient formatting and reminder copy.
 * Australian numbers match the previous SendSMS rules: keep a 61 prefix,
 * strip a leading +, turn a leading 0 into the default country code, and
 * otherwise prefix that country code. Spaces and punctuation are removed
 * so handset numbers still match.
 */

export const DEFAULT_SMS_COUNTRY_CODE = "61";
export const DEFAULT_SMS_SENDER_ID = "YCD";
export const DEFAULT_SMS_MESSAGE_TYPE = "1-way" as const;

export type PublicSmsSettings = {
  databaseReady: boolean;
  provider: "directsms" | "twilio";
  enabled: boolean;
  remindersEnabled: boolean;
  username: string;
  hasPassword: boolean;
  credentialLocked: boolean;
  senderId: string;
  secureTransport: boolean;
  messageType: "1-way" | "2-way";
  defaultCountryCode: string;
  reminderTemplate: string;
  ready: boolean;
  source: "dashboard" | "environment" | "unconfigured";
  twilioReady: boolean;
};
export const DIRECTSMS_SEND_URL = "https://api.directsms.com.au/s3/http/send_message";

export const SMS_TEMPLATE_KEYS = ["firstName", "eventName", "date", "location", "website"] as const;

export const DEFAULT_SMS_REMINDER_TEMPLATE =
  "Reminder: {firstName}, {eventName} is on {date} in {location}. Details: {website}";

const SENDER_ID = /^[A-Za-z0-9]{1,11}$/;
const COUNTRY_CODE = /^\d{1,3}$/;

export function normalizeSmsRecipient(
  raw: string | null | undefined,
  defaultCountryCode: string = DEFAULT_SMS_COUNTRY_CODE,
): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;

  const hadPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  const countryCode = defaultCountryCode.replace(/\D/g, "") || DEFAULT_SMS_COUNTRY_CODE;
  if (!digits) return null;

  let phone: string;
  const alreadyInternational =
    digits.startsWith(countryCode) && digits.length > countryCode.length + 6;
  if (alreadyInternational) phone = digits;
  else if (hadPlus) phone = digits;
  else if (digits.startsWith("0")) phone = `${countryCode}${digits.slice(1)}`;
  else phone = `${countryCode}${digits}`;

  if (phone.length < 8 || phone.length > 15) return null;
  return phone;
}

export function isAllowedDirectSmsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash) return false;
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    return url.hostname === "api.directsms.com.au" && url.pathname === "/s3/http/send_message";
  } catch {
    return false;
  }
}

export function directSmsUrl(secure: boolean): string {
  return `${secure ? "https" : "http"}://api.directsms.com.au/s3/http/send_message`;
}

export type SmsTemplateValues = {
  firstName: string;
  eventName: string;
  date: string;
  location: string;
  website: string;
};

export function unknownSmsPlaceholders(template: string): string[] {
  const found = new Set<string>();
  for (const match of template.matchAll(/\{(\w+)\}/g)) {
    const key = match[1];
    if (key && !(SMS_TEMPLATE_KEYS as readonly string[]).includes(key)) found.add(key);
  }
  return [...found];
}

export function renderSmsTemplate(template: string, values: SmsTemplateValues): string {
  return template
    .replace(/\{(\w+)\}/g, (token, key: string) => {
      if (!(SMS_TEMPLATE_KEYS as readonly string[]).includes(key)) return token;
      return values[key as keyof SmsTemplateValues] ?? "";
    })
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 480);
}

export function validateSmsSenderId(value: string): string | null {
  const senderId = value.trim();
  if (!SENDER_ID.test(senderId)) return "Sender ID must be 1–11 letters or numbers.";
  return null;
}

export function validateSmsCountryCode(value: string): string | null {
  const code = value.trim();
  if (!COUNTRY_CODE.test(code)) return "Country code must be 1–3 digits.";
  return null;
}

export function validateSmsReminderTemplate(value: string): string | null {
  const template = value.trim();
  if (!template) return "Reminder message is required.";
  if (template.length > 320) return "Reminder message must be 320 characters or fewer.";
  const unknown = unknownSmsPlaceholders(template);
  if (unknown.length > 0) {
    return `Unknown placeholder${unknown.length === 1 ? "" : "s"}: ${unknown.map((key) => `{${key}}`).join(", ")}.`;
  }
  return null;
}
