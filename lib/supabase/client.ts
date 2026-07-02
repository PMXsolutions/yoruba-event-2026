import { createBrowserClient } from "@supabase/ssr";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/normalize-url";

/**
 * Browser Supabase client with session persistence for committee auth.
 */
export function createBrowserSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  const url = normalizeSupabaseProjectUrl(rawUrl);
  return createBrowserClient(url, anonKey);
}
