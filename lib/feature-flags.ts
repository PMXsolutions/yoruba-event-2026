/**
 * Central feature flags for Promax Event Platform.
 * Safe defaults: public registration stays OPEN unless explicitly disabled.
 */

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return defaultValue;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
  return defaultValue;
}

export type FeatureFlags = {
  PUBLIC_REGISTRATION_OPEN: boolean;
  SPONSOR_ENQUIRY_OPEN: boolean;
  VOLUNTEER_INTEREST_OPEN: boolean;
  EMAIL_CONFIRMATIONS_ENABLED: boolean;
  SMS_ENABLED: boolean;
  SEATING_ENABLED: boolean;
  QR_CHECKIN_ENABLED: boolean;
  DASHBOARD_AUTH_REQUIRED: boolean;
};

/** Server-safe flag snapshot (reads process.env). */
export function getFeatureFlags(): FeatureFlags {
  return {
    PUBLIC_REGISTRATION_OPEN: envFlag("PUBLIC_REGISTRATION_OPEN", true),
    SPONSOR_ENQUIRY_OPEN: envFlag("SPONSOR_ENQUIRY_OPEN", true),
    VOLUNTEER_INTEREST_OPEN: envFlag("VOLUNTEER_INTEREST_OPEN", true),
    EMAIL_CONFIRMATIONS_ENABLED: envFlag("EMAIL_CONFIRMATIONS_ENABLED", true),
    SMS_ENABLED: envFlag("SMS_ENABLED", false) || envFlag("NOTIFY_SMS_ENABLED", false),
    SEATING_ENABLED: envFlag("SEATING_ENABLED", true),
    QR_CHECKIN_ENABLED: envFlag("QR_CHECKIN_ENABLED", true),
    DASHBOARD_AUTH_REQUIRED: envFlag("DASHBOARD_AUTH_REQUIRED", true),
  };
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return getFeatureFlags()[flag];
}
