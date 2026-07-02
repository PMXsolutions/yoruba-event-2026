import { createClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/normalize-url";

/**
 * Browser Supabase client (anon key). Safe for public reads when RLS allows.
 * RSVP writes use the server action with the service role client instead.
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
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
