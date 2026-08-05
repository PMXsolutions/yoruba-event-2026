"use client";

import { createBrowserClient } from "@supabase/ssr";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/normalize-url";

/**
 * Browser Supabase client for auth UI (login / logout / password reset).
 * Never use the service role key here.
 */
export function createBrowserSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !anonKey) {
    throw new Error("Supabase is not configured in this environment.");
  }
  return createBrowserClient(normalizeSupabaseProjectUrl(rawUrl), anonKey);
}
