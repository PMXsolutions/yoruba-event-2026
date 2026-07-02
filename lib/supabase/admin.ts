import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/normalize-url";

/**
 * Service role client — bypasses RLS. Use only in Server Actions / Route Handlers / server code.
 * Never import this module from client components.
 */
export function createServiceRoleClient(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!rawUrl || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your environment variables.",
    );
  }
  const url = normalizeSupabaseProjectUrl(rawUrl);
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
