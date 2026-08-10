/**
 * Central production feature flags for Promax Event Platform.
 * Defaults match controlled public launch mode.
 */

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return defaultValue;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(v)) return true;
  if (["0", "false", "no", "off"].includes(v)) return false;
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
    dashboardAuthRequired: envFlag("DASHBOARD_AUTH_REQUIRED", true),
  };
}
