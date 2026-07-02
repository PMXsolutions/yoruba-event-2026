/**
 * Normalizes the Supabase project URL for @supabase/supabase-js.
 * Common misconfiguration: pasting `.../rest/v1` or a trailing slash breaks REST paths (e.g. PostgREST PGRST125).
 */
export function normalizeSupabaseProjectUrl(url: string): string {
  let u = url.trim();
  u = u.replace(/\/+$/, "");
  u = u.replace(/\/rest\/v1$/i, "");
  u = u.replace(/\/+$/, "");
  return u;
}
