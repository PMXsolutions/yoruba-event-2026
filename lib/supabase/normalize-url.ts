/**
 * Trim and strip one layer of wrapping quotes.
 * Vercel values are often pasted with the quotes included, which makes the URL or key invalid.
 */
export function cleanEnvValue(value: string | undefined): string {
  if (typeof value !== "string") return "";
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"') && v.length >= 2) ||
    (v.startsWith("'") && v.endsWith("'") && v.length >= 2)
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/**
 * Normalizes the Supabase project URL for @supabase/supabase-js.
 * Common misconfiguration: pasting `.../rest/v1` or a trailing slash breaks REST paths (e.g. PostgREST PGRST125).
 */
export function normalizeSupabaseProjectUrl(url: string): string {
  let u = cleanEnvValue(url);
  u = u.replace(/\/+$/, "");
  u = u.replace(/\/rest\/v1$/i, "");
  u = u.replace(/\/+$/, "");
  return u;
}
