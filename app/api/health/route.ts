import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  getSupabaseEnvPresence,
  missingSupabaseEnvVarNames,
} from "@/lib/supabase/env-status";

export const dynamic = "force-dynamic";

type HealthOk = { status: "ok"; supabase: true; env: true };
type HealthError = {
  status: "error";
  supabase: boolean;
  env: boolean;
  code: string;
  missingEnvVars?: string[];
};

export async function GET(): Promise<NextResponse<HealthOk | HealthError>> {
  const presence = getSupabaseEnvPresence();

  if (!presence.allPresent) {
    const missing = missingSupabaseEnvVarNames(presence);
    console.error(
      "[api/health] Supabase environment variables missing (names only):",
      missing.join(", ") || "(unknown)",
    );
    return NextResponse.json(
      {
        status: "error",
        supabase: false,
        env: false,
        code: "MISSING_ENV_VARS",
        missingEnvVars: missing,
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
        if (error.code === "PGRST125") {
          console.error(
            "[api/health] PGRST125: check NEXT_PUBLIC_SUPABASE_URL is exactly https://<ref>.supabase.co (no /rest/v1 suffix, no stray characters).",
          );
        }
      }
      return NextResponse.json(
        {
          status: "error",
          supabase: false,
          env: true,
          code: tableMissing ? "RSVPS_TABLE_MISSING" : "SUPABASE_QUERY_FAILED",
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
        code: "SUPABASE_CONNECTION_FAILED",
      },
      { status: 503 },
    );
  }

  console.info("[api/health] Supabase env present and REST query to public.rsvps succeeded.");
  return NextResponse.json({ status: "ok", supabase: true, env: true });
}
