import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  getSupabaseEnvPresence,
  missingSupabaseEnvVarNames,
} from "@/lib/supabase/env-status";
import { TICKET_TYPES } from "@/lib/site";

export const dynamic = "force-dynamic";

function insertTestAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" || process.env.ENABLE_RSVP_INSERT_TEST === "true"
  );
}

type OkBody = {
  status: "ok";
  insert: true;
  testRowRemoved: true;
};

type ErrorBody = {
  status: "error";
  code: string;
  insert?: boolean;
  missingEnvVars?: string[];
};

/**
 * Temporary POST-only check: insert a disposable row into `rsvps`, then delete it.
 * Disabled in production unless ENABLE_RSVP_INSERT_TEST=true. Never returns secrets.
 */
export async function POST(): Promise<NextResponse<OkBody | ErrorBody>> {
  if (!insertTestAllowed()) {
    console.warn("[api/health/rsvp-insert-test] Blocked: not enabled in this environment.");
    return NextResponse.json(
      { status: "error", code: "INSERT_TEST_DISABLED" },
      { status: 404 },
    );
  }

  const presence = getSupabaseEnvPresence();
  if (!presence.allPresent) {
    const missing = missingSupabaseEnvVarNames(presence);
    console.error(
      "[api/health/rsvp-insert-test] Missing env (names only):",
      missing.join(", "),
    );
    return NextResponse.json(
      {
        status: "error",
        code: "MISSING_ENV_VARS",
        missingEnvVars: missing,
      },
      { status: 503 },
    );
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[api/health/rsvp-insert-test] Client init failed:", message);
    return NextResponse.json(
      { status: "error", code: "SUPABASE_CLIENT_FAILED" },
      { status: 503 },
    );
  }

  const email = `health-check+${Date.now()}@invalid.example`;
  const row = {
    full_name: "Connectivity test (auto-deleted)",
    email,
    phone: null as string | null,
    number_of_attendees: 1,
    ticket_type: TICKET_TYPES[0],
    notes: "Temporary RSVP backend insert test",
  };

  const { data: inserted, error: insertError } = await supabase
    .from("rsvps")
    .insert(row)
    .select("id")
    .single();

  if (insertError) {
    console.error(
      "[api/health/rsvp-insert-test] Insert failed:",
      insertError.message,
      insertError.code,
      insertError.details ?? "",
    );
    const code =
      insertError.code === "42P01" || /relation|does not exist/i.test(insertError.message)
        ? "RSVPS_TABLE_MISSING"
        : "INSERT_FAILED";
    return NextResponse.json(
      { status: "error", code, insert: false },
      { status: 503 },
    );
  }

  if (!inserted?.id) {
    console.error("[api/health/rsvp-insert-test] Insert returned no id.");
    return NextResponse.json(
      { status: "error", code: "INSERT_NO_ID", insert: false },
      { status: 503 },
    );
  }

  const { error: deleteError } = await supabase.from("rsvps").delete().eq("id", inserted.id);

  if (deleteError) {
    console.error(
      "[api/health/rsvp-insert-test] Test row inserted but delete failed; remove row manually. id:",
      inserted.id,
      "error:",
      deleteError.message,
    );
    return NextResponse.json(
      { status: "error", code: "TEST_ROW_DELETE_FAILED", insert: true },
      { status: 503 },
    );
  }

  console.info("[api/health/rsvp-insert-test] Insert and delete succeeded for id:", inserted.id);
  return NextResponse.json({
    status: "ok",
    insert: true,
    testRowRemoved: true,
  });
}
