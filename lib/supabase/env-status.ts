import "server-only";

export type SupabaseEnvPresence = {
  hasPublicUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  /** URL + anon + service role (full platform). */
  allPresent: boolean;
  /** URL + service role — enough for server-side inserts/CRM via service role. */
  serviceRoleReady: boolean;
  /** URL + anon — enough for browser Auth (/login). */
  authReady: boolean;
};

function isNonEmpty(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Presence-only check for Supabase-related env vars (never reads or logs values).
 */
export function getSupabaseEnvPresence(): SupabaseEnvPresence {
  const hasPublicUrl = isNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = isNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRoleKey = isNonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return {
    hasPublicUrl,
    hasAnonKey,
    hasServiceRoleKey,
    serviceRoleReady: hasPublicUrl && hasServiceRoleKey,
    authReady: hasPublicUrl && hasAnonKey,
    allPresent: hasPublicUrl && hasAnonKey && hasServiceRoleKey,
  };
}

export function missingSupabaseEnvVarNames(presence: SupabaseEnvPresence): string[] {
  const missing: string[] = [];
  if (!presence.hasPublicUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!presence.hasAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!presence.hasServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

export function missingServiceRoleEnvVarNames(presence: SupabaseEnvPresence): string[] {
  const missing: string[] = [];
  if (!presence.hasPublicUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!presence.hasServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}
