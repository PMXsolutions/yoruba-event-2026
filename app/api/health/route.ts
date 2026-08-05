import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  getSupabaseEnvPresence,
  missingServiceRoleEnvVarNames,
  missingSupabaseEnvVarNames,
} from "@/lib/supabase/env-status";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";

export const dynamic = "force-dynamic";

type HealthOk = {
  status: "ok";
  supabase: true;
  env: true;
  authConfigured: boolean;
  event: string;
  emailConfigured: boolean;
  emailTransport: "smtp" | "resend" | "none";
};

type HealthError = {
  status: "error";
  supabase: boolean;
  env: boolean;
  authConfigured?: boolean;
  code: string;
  missingEnvVars?: string[];
  event?: string;
  emailConfigured?: boolean;
  emailTransport?: "smtp" | "resend" | "none";
};

export async function GET(): Promise<NextResponse<HealthOk | HealthError>> {
  const presence = getSupabaseEnvPresence();
  const email = getEmailEnvPresence();

  let eventSlug = "unknown";
  try {
    eventSlug = getActiveEventConfig().slug;
  } catch {
    return NextResponse.json(
      {
        status: "error",
        supabase: false,
        env: presence.serviceRoleReady,
        authConfigured: presence.authReady,
        code: "EVENT_CONFIG_MISSING",
        emailConfigured: email.ready,
        emailTransport: email.transport,
      },
      { status: 503 },
    );
  }

  if (!presence.serviceRoleReady) {
    const missing = missingServiceRoleEnvVarNames(presence);
    // Include anon in the list when fully missing so operators see the full set needed.
    const allMissing = missingSupabaseEnvVarNames(presence);
    console.error(
      "[api/health] Supabase environment variables missing (names only):",
      allMissing.join(", ") || "(unknown)",
    );
    return NextResponse.json(
      {
        status: "error",
        supabase: false,
        env: false,
        authConfigured: presence.authReady,
        code: "MISSING_ENV_VARS",
        missingEnvVars: allMissing.length > 0 ? allMissing : missing,
        event: eventSlug,
        emailConfigured: email.ready,
        emailTransport: email.transport,
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("rsvps").select("id").limit(1);
    if (error) {
      const tableMissing =
        error.code === "42P01" || /relation|does not exist|schema cache/i.test(error.message);
      if (tableMissing) {
        console.error(
          "[api/health] public.rsvps appears missing or not exposed to PostgREST. Run migrations in Supabase.",
          error.message,
        );
      } else {
        console.error("[api/health] Supabase query failed:", error.message, error.code);
      }
      return NextResponse.json(
        {
          status: "error",
          supabase: false,
          env: true,
          authConfigured: presence.authReady,
          code: tableMissing ? "RSVPS_TABLE_MISSING" : "SUPABASE_QUERY_FAILED",
          event: eventSlug,
          emailConfigured: email.ready,
          emailTransport: email.transport,
        },
        { status: 503 },
      );
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/health] Supabase connection error:", message);
    return NextResponse.json(
      {
        status: "error",
        supabase: false,
        env: true,
        authConfigured: presence.authReady,
        code: "SUPABASE_CONNECTION_FAILED",
        event: eventSlug,
        emailConfigured: email.ready,
        emailTransport: email.transport,
      },
      { status: 503 },
    );
  }

  console.info(
    "[api/health] OK — event=",
    eventSlug,
    "emailConfigured=",
    email.ready,
    "authConfigured=",
    presence.authReady,
  );
  return NextResponse.json({
    status: "ok",
    supabase: true,
    env: true,
    authConfigured: presence.authReady,
    event: eventSlug,
    emailConfigured: email.ready,
    emailTransport: email.transport,
  });
}
