/**
 * Central production feature flags for Promax Event Platform.
 * Defaults match controlled public launch mode.
 */

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null) return defaultValue;
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1).trim();
  }
  if (v === "") return defaultValue;
  const lower = v.toLowerCase();
  if (["1", "true", "yes", "on"].includes(lower)) return true;
  if (["0", "false", "no", "off"].includes(lower)) return false;
  return defaultValue;
}

export type PlatformFeatureFlags = {
  /** Public Register Interest form accepts submissions */
  publicRegistrationOpen: boolean;
  /** Send confirmation emails when a transport is configured */
  emailConfirmationsEnabled: boolean;
  /** Attempt SMS when Twilio + consent are present */
  smsEnabled: boolean;
  /** Require authenticated committee access for /dashboard */
  dashboardAuthRequired: boolean;
};

export function getFeatureFlags(): PlatformFeatureFlags {
  const smsEnabled =
    envFlag("SMS_ENABLED", false) || envFlag("NOTIFY_SMS_ENABLED", false);

  return {
    publicRegistrationOpen: envFlag("PUBLIC_REGISTRATION_OPEN", true),
    emailConfirmationsEnabled: envFlag("EMAIL_CONFIRMATIONS_ENABLED", true),
    smsEnabled,
    dashboardAuthRequired: process.env.NODE_ENV === "production" || envFlag("DASHBOARD_AUTH_REQUIRED", true),
  };
}
