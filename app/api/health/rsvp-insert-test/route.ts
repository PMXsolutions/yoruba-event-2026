import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getDatabaseEnvPresence, missingDatabaseEnvVarNames } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbOne } from "@/lib/db/query";
import { TICKET_TYPES } from "@/lib/site";

export const dynamic = "force-dynamic";

function insertTestAllowed(): boolean {
  return process.env.NODE_ENV !== "production";
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
 * Always disabled in production. Never returns secrets.
 */
export async function POST(): Promise<NextResponse<OkBody | ErrorBody>> {
  if (!insertTestAllowed()) {
    console.warn("[api/health/rsvp-insert-test] Blocked: not enabled in this environment.");
    return NextResponse.json({ status: "error", code: "INSERT_TEST_DISABLED" }, { status: 404 });
  }

  const presence = getDatabaseEnvPresence();
  if (!presence.ready) {
    const missing = missingDatabaseEnvVarNames();
    console.error("[api/health/rsvp-insert-test] Missing env (names only):", missing.join(", "));
    return NextResponse.json(
      { status: "error", code: "MISSING_ENV_VARS", missingEnvVars: missing },
      { status: 503 },
    );
  }

  const { getActiveEventConfig } = await import("@/platform/core/config/active-event");
  const event = getActiveEventConfig();
  const id = randomUUID();
  const email = `health-check+${Date.now()}@invalid.example`;

  try {
    const inserted = await dbOne<{ id: string }>(
      `INSERT INTO rsvps (
         id, full_name, email, phone, number_of_attendees, ticket_type, notes,
         event_slug, registration_reference, status
       )
       OUTPUT INSERTED.id
       VALUES (
         @id, @fullName, @email, NULL, 1, @ticketType, @notes,
         @slug, @reference, N'new'
       )`,
      {
        id,
        fullName: "Connectivity test (auto-deleted)",
        email,
        ticketType: TICKET_TYPES[0],
        notes: "Temporary RSVP backend insert test",
        slug: event.slug,
        reference: `TEST-${Date.now().toString(36).toUpperCase()}`,
      },
    );
    if (!inserted?.id) {
      return NextResponse.json({ status: "error", code: "INSERT_NO_ID", insert: false }, { status: 503 });
    }
    await dbExec(`DELETE FROM rsvps WHERE id = @id`, { id: inserted.id });
    console.info("[api/health/rsvp-insert-test] Insert and delete succeeded for id:", inserted.id);
    return NextResponse.json({ status: "ok", insert: true, testRowRemoved: true });
  } catch (error) {
    const message = errorMessage(error);
    console.error("[api/health/rsvp-insert-test] Failed:", message);
    const code = /invalid object name/i.test(message) ? "RSVPS_TABLE_MISSING" : "INSERT_FAILED";
    return NextResponse.json({ status: "error", code, insert: false }, { status: 503 });
  }
}
