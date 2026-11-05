import "server-only";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbOne } from "@/lib/db/query";
import { getFeatureFlags } from "@/platform/core/flags";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import {
  readSmsEnvironment,
  resolveSmsSettingsFromSources,
  settingsApiUrl,
  toPublicSmsSettings,
  type PublicSmsSettings,
  type ResolvedSmsSettings,
  type SmsMessageType,
  type SmsProviderName,
  type SmsSettingsInput,
  type StoredSmsSettings,
} from "@/platform/engines/notifications/sms/config";
import { decryptSecret, encryptSecret } from "@/platform/engines/notifications/sms/secret";

type SmsSettingsRow = {
  provider: string;
  enabled: boolean | number;
  reminders_enabled: boolean | number;
  username: string | null;
  password: string | null;
  sender_id: string;
  api_url: string;
  message_type: string;
  default_country_code: string;
  reminder_template: string | null;
};

function asBool(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
}

function mapRow(row: SmsSettingsRow): StoredSmsSettings {
  let password = "";
  let credentialLocked = false;
  if (row.password) {
    try {
      password = decryptSecret(row.password);
    } catch (error) {
      credentialLocked = true;
      console.error("[sms] Saved credential could not be read:", errorMessage(error));
    }
  }
  const provider: SmsProviderName = row.provider === "twilio" ? "twilio" : "directsms";
  const messageType: SmsMessageType = row.message_type === "2-way" ? "2-way" : "1-way";
  return {
    provider,
    enabled: asBool(row.enabled),
    remindersEnabled: asBool(row.reminders_enabled),
    username: row.username?.trim() ?? "",
    password,
    hasPassword: Boolean(row.password),
    credentialLocked,
    senderId: row.sender_id,
    apiUrl: row.api_url,
    messageType,
    defaultCountryCode: row.default_country_code,
    reminderTemplate: row.reminder_template?.trim() ?? "",
  };
}

async function readStoredSmsSettings(eventSlug: string): Promise<StoredSmsSettings | null> {
  try {
    const row = await dbOne<SmsSettingsRow>(
      `SELECT provider, enabled, reminders_enabled, username, password, sender_id, api_url, message_type, default_country_code, reminder_template
       FROM sms_settings WHERE event_slug = @slug`,
      { slug: eventSlug },
    );
    return row ? mapRow(row) : null;
  } catch (error) {
    const message = errorMessage(error);
    if (/Invalid object name ['"]?sms_settings/i.test(message)) return null;
    throw error;
  }
}

export async function resolveSmsSettings(): Promise<ResolvedSmsSettings> {
  const env = readSmsEnvironment();
  const flags = getFeatureFlags();
  const database = getDatabaseEnvPresence();
  let stored: StoredSmsSettings | null = null;
  if (database.ready) {
    try {
      stored = await readStoredSmsSettings(getActiveEventConfig().slug);
    } catch (error) {
      console.warn("[sms] Settings could not be loaded:", errorMessage(error));
    }
  }
  return resolveSmsSettingsFromSources(stored, env, flags.smsEnabled);
}

export async function getPublicSmsSettings(): Promise<PublicSmsSettings> {
  const databaseReady = getDatabaseEnvPresence().ready;
  const resolved = await resolveSmsSettings();
  return toPublicSmsSettings(resolved, databaseReady);
}

export async function saveSmsSettings(
  input: SmsSettingsInput,
  actorId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const database = getDatabaseEnvPresence();
  if (!database.ready) return { ok: false, error: "Database is not configured." };

  const event = getActiveEventConfig();
  let existing: StoredSmsSettings | null = null;
  try {
    existing = await readStoredSmsSettings(event.slug);
  } catch (error) {
    console.error("[sms] Settings read failed:", errorMessage(error));
    return { ok: false, error: "SMS settings could not be saved. Apply the latest database migration." };
  }

  const passwordProvided = Boolean(input.password && input.password.length > 0);
  if (input.provider === "directsms" && input.enabled && !passwordProvided && !existing?.hasPassword && !readSmsEnvironment().directsms.password) {
    return { ok: false, error: "DirectSMS password is required the first time SMS is enabled." };
  }

  let passwordCipher: string | null = null;
  if (passwordProvided && input.password) {
    try {
      passwordCipher = encryptSecret(input.password);
    } catch (error) {
      console.error("[sms] Credential encryption failed:", errorMessage(error));
      return { ok: false, error: "SMS password could not be stored. Check SESSION_SECRET." };
    }
  }

  const params = {
    slug: event.slug,
    provider: input.provider,
    enabled: input.enabled,
    remindersEnabled: input.remindersEnabled,
    username: input.username || null,
    password: passwordCipher,
    updatePassword: passwordProvided ? 1 : 0,
    senderId: input.senderId,
    apiUrl: settingsApiUrl(input),
    messageType: input.messageType,
    countryCode: input.defaultCountryCode,
    reminderTemplate: input.reminderTemplate,
    actorId,
  };

  try {
    const updated = await dbExec(
      `UPDATE sms_settings
       SET provider = @provider,
           enabled = @enabled,
           reminders_enabled = @remindersEnabled,
           username = @username,
           password = CASE WHEN @updatePassword = 1 THEN @password ELSE password END,
           sender_id = @senderId,
           api_url = @apiUrl,
           message_type = @messageType,
           default_country_code = @countryCode,
           reminder_template = @reminderTemplate,
           updated_at = SYSDATETIMEOFFSET(),
           updated_by = @actorId
       WHERE event_slug = @slug`,
      params,
    );
    if (updated === 0) {
      await dbExec(
        `INSERT INTO sms_settings (
           event_slug, provider, enabled, reminders_enabled, username, password, sender_id, api_url, message_type, default_country_code, reminder_template, updated_by
         ) VALUES (
           @slug, @provider, @enabled, @remindersEnabled, @username, @password, @senderId, @apiUrl, @messageType, @countryCode, @reminderTemplate, @actorId
         )`,
        params,
      );
    }
    return { ok: true };
  } catch (error) {
    const message = errorMessage(error);
    console.error("[sms] Settings save failed:", message);
    if (/Invalid object name ['"]?sms_settings/i.test(message)) {
      return { ok: false, error: "SMS settings are not in this database yet. Apply sql/mssql/001_create_and_migrate.sql." };
    }
    return { ok: false, error: "SMS settings could not be saved." };
  }
}
