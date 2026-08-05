"use client";

import { createBrowserClient } from "@supabase/ssr";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/normalize-url";

export class AuthConfigError extends Error {
  constructor(message = "Authentication is not configured for this deployment.") {
    super(message);
    this.name = "AuthConfigError";
  }
}

/**
 * Browser Supabase client for auth UI (login / logout / password reset).
 * Never use the service role key here.
 */
export function createBrowserSupabaseClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl?.trim() || !anonKey?.trim()) {
    throw new AuthConfigError(
      "Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.",
    );
  }
  return createBrowserClient(normalizeSupabaseProjectUrl(rawUrl), anonKey);
}
