import "server-only";

import {
  DEFAULT_SMS_COUNTRY_CODE,
  DEFAULT_SMS_REMINDER_TEMPLATE,
  DEFAULT_SMS_SENDER_ID,
  DIRECTSMS_SEND_URL,
  directSmsUrl,
  isAllowedDirectSmsUrl,
  validateSmsCountryCode,
  validateSmsReminderTemplate,
  validateSmsSenderId,
  type PublicSmsSettings,
} from "@/platform/engines/notifications/sms/format";

export type { PublicSmsSettings };

export const SMS_PROVIDERS = ["directsms", "twilio"] as const;
export type SmsProviderName = (typeof SMS_PROVIDERS)[number];
export const SMS_MESSAGE_TYPES = ["1-way", "2-way"] as const;
export type SmsMessageType = (typeof SMS_MESSAGE_TYPES)[number];

export type SmsEnvironment = {
  directsms: {
    username: string;
    password: string;
    senderId: string;
    apiUrl: string;
    messageType: string;
    countryCode: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
};

export type StoredSmsSettings = {
  provider: SmsProviderName;
  enabled: boolean;
  remindersEnabled: boolean;
  username: string;
  password: string;
  hasPassword: boolean;
  credentialLocked: boolean;
  senderId: string;
  apiUrl: string;
  messageType: SmsMessageType;
  defaultCountryCode: string;
  reminderTemplate: string;
};

export type ResolvedSmsSettings = StoredSmsSettings & {
  ready: boolean;
  source: "dashboard" | "environment" | "unconfigured";
  twilioReady: boolean;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFromNumber: string;
};

function envValue(name: string): string {
  const raw = process.env[name];
  return typeof raw === "string" ? raw.trim() : "";
}

function asMessageType(value: string | undefined): SmsMessageType {
  return value === "2-way" ? "2-way" : "1-way";
}

export function readSmsEnvironment(): SmsEnvironment {
  const apiUrl = envValue("DIRECTSMS_URL") || DIRECTSMS_SEND_URL;
  return {
    directsms: {
      username: envValue("DIRECTSMS_USERNAME"),
      password: envValue("DIRECTSMS_PASSWORD"),
      senderId: envValue("DIRECTSMS_SENDER_ID") || DEFAULT_SMS_SENDER_ID,
      apiUrl: isAllowedDirectSmsUrl(apiUrl) ? apiUrl : DIRECTSMS_SEND_URL,
      messageType: envValue("DIRECTSMS_TYPE") || "1-way",
      countryCode: envValue("DIRECTSMS_COUNTRY_CODE") || DEFAULT_SMS_COUNTRY_CODE,
    },
    twilio: {
      accountSid: envValue("TWILIO_ACCOUNT_SID"),
      authToken: envValue("TWILIO_AUTH_TOKEN"),
      fromNumber: envValue("TWILIO_FROM_NUMBER"),
    },
  };
}

function twilioReady(env: SmsEnvironment): boolean {
  return Boolean(env.twilio.accountSid && env.twilio.authToken && env.twilio.fromNumber);
}

function directSmsReady(username: string, password: string, senderId: string, apiUrl: string): boolean {
  return Boolean(username && password && !validateSmsSenderId(senderId) && isAllowedDirectSmsUrl(apiUrl));
}

/**
 * Dashboard row wins when one has been saved. Otherwise SMS_ENABLED plus
 * environment credentials keep the previous Twilio (or DirectSMS) behaviour.
 */
export function resolveSmsSettingsFromSources(
  stored: StoredSmsSettings | null,
  env: SmsEnvironment,
  flagEnabled: boolean,
): ResolvedSmsSettings {
  const envTwilioReady = twilioReady(env);
  const envDirectReady = directSmsReady(
    env.directsms.username,
    env.directsms.password,
    env.directsms.senderId,
    env.directsms.apiUrl,
  );

  if (!stored) {
    const provider: SmsProviderName = envDirectReady || !envTwilioReady ? "directsms" : "twilio";
    const ready = provider === "directsms" ? envDirectReady : envTwilioReady;
    return {
      provider,
      enabled: flagEnabled,
      remindersEnabled: false,
      username: env.directsms.username,
      password: env.directsms.password,
      hasPassword: Boolean(env.directsms.password),
      credentialLocked: false,
      senderId: env.directsms.senderId || DEFAULT_SMS_SENDER_ID,
      apiUrl: env.directsms.apiUrl,
      messageType: asMessageType(env.directsms.messageType),
      defaultCountryCode: env.directsms.countryCode || DEFAULT_SMS_COUNTRY_CODE,
      reminderTemplate: DEFAULT_SMS_REMINDER_TEMPLATE,
      ready,
      source: ready ? "environment" : "unconfigured",
      twilioReady: envTwilioReady,
      twilioAccountSid: env.twilio.accountSid,
      twilioAuthToken: env.twilio.authToken,
      twilioFromNumber: env.twilio.fromNumber,
    };
  }

  const username = stored.username || env.directsms.username;
  const password = stored.credentialLocked ? "" : stored.password || env.directsms.password;
  const senderId = stored.senderId || env.directsms.senderId || DEFAULT_SMS_SENDER_ID;
  const apiUrl = isAllowedDirectSmsUrl(stored.apiUrl) ? stored.apiUrl : env.directsms.apiUrl;
  const ready =
    stored.provider === "twilio"
      ? envTwilioReady
      : directSmsReady(username, password, senderId, apiUrl) && !stored.credentialLocked;

  return {
    provider: stored.provider,
    enabled: stored.enabled,
    remindersEnabled: stored.remindersEnabled,
    username,
    password,
    hasPassword: stored.hasPassword || Boolean(password),
    credentialLocked: stored.credentialLocked,
    senderId,
    apiUrl,
    messageType: stored.messageType,
    defaultCountryCode: stored.defaultCountryCode || DEFAULT_SMS_COUNTRY_CODE,
    reminderTemplate: stored.reminderTemplate || DEFAULT_SMS_REMINDER_TEMPLATE,
    ready,
    source: "dashboard",
    twilioReady: envTwilioReady,
    twilioAccountSid: env.twilio.accountSid,
    twilioAuthToken: env.twilio.authToken,
    twilioFromNumber: env.twilio.fromNumber,
  };
}

export function toPublicSmsSettings(
  resolved: ResolvedSmsSettings,
  databaseReady: boolean,
): PublicSmsSettings {
  return {
    databaseReady,
    provider: resolved.provider,
    enabled: resolved.enabled,
    remindersEnabled: resolved.remindersEnabled,
    username: resolved.username,
    hasPassword: resolved.hasPassword,
    credentialLocked: resolved.credentialLocked,
    senderId: resolved.senderId,
    secureTransport: resolved.apiUrl.startsWith("https://"),
    messageType: resolved.messageType,
    defaultCountryCode: resolved.defaultCountryCode,
    reminderTemplate: resolved.reminderTemplate,
    ready: resolved.ready,
    source: resolved.source,
    twilioReady: resolved.twilioReady,
  };
}

export type SmsSettingsInput = {
  provider: SmsProviderName;
  enabled: boolean;
  remindersEnabled: boolean;
  username: string;
  password?: string;
  senderId: string;
  secureTransport: boolean;
  messageType: SmsMessageType;
  defaultCountryCode: string;
  reminderTemplate: string;
};

export function parseSmsSettingsInput(
  raw: unknown,
): { ok: true; value: SmsSettingsInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") return { ok: false, error: "SMS settings are incomplete." };
  const body = raw as Record<string, unknown>;
  const provider = body.provider === "twilio" ? "twilio" : body.provider === "directsms" ? "directsms" : null;
  if (!provider) return { ok: false, error: "Choose DirectSMS or Twilio." };
  const messageType = body.messageType === "2-way" ? "2-way" : body.messageType === "1-way" ? "1-way" : null;
  if (!messageType) return { ok: false, error: "Choose a message type." };

  const senderId = typeof body.senderId === "string" ? body.senderId : "";
  const senderError = validateSmsSenderId(senderId);
  if (senderError) return { ok: false, error: senderError };

  const defaultCountryCode = typeof body.defaultCountryCode === "string" ? body.defaultCountryCode : "";
  const countryError = validateSmsCountryCode(defaultCountryCode);
  if (countryError) return { ok: false, error: countryError };

  const reminderTemplate = typeof body.reminderTemplate === "string" ? body.reminderTemplate : "";
  const templateError = validateSmsReminderTemplate(reminderTemplate);
  if (templateError) return { ok: false, error: templateError };

  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (username.length > 200) return { ok: false, error: "Username is too long." };
  const password = typeof body.password === "string" ? body.password : "";
  if (password.length > 400) return { ok: false, error: "Password is too long." };

  const enabled = body.enabled === true;
  if (provider === "directsms" && enabled && !username) {
    return { ok: false, error: "DirectSMS username is required when SMS is enabled." };
  }

  return {
    ok: true,
    value: {
      provider,
      enabled,
      remindersEnabled: body.remindersEnabled === true,
      username,
      password,
      senderId: senderId.trim(),
      secureTransport: body.secureTransport !== false,
      messageType,
      defaultCountryCode: defaultCountryCode.trim(),
      reminderTemplate: reminderTemplate.trim(),
    },
  };
}

export function settingsApiUrl(input: SmsSettingsInput): string {
  return directSmsUrl(input.secureTransport);
}
