import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import {
  type DashboardRsvpRecord,
  type FetchDashboardRsvpsResult,
  type RsvpStatus,
  isRsvpStatus,
} from "@/platform/engines/dashboard/rsvp/types";

type RsvpRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  number_of_attendees: number;
  ticket_type: string | null;
  notes: string | null;
  created_at: string;
  status: string | null;
  internal_notes: string | null;
  contacted_at: string | null;
};

function mapRow(row: RsvpRow): DashboardRsvpRecord {
  const status = row.status && isRsvpStatus(row.status) ? row.status : "new";
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    numberOfAttendees: row.number_of_attendees,
    ticketType: row.ticket_type,
    notes: row.notes,
    createdAt: row.created_at,
    status,
    internalNotes: row.internal_notes,
    contactedAt: row.contacted_at,
  };
}

function classifyQueryError(message: string, code?: string): FetchDashboardRsvpsResult {
  const tableMissing =
    code === "42P01" || /relation|does not exist|schema cache|PGRST205/i.test(message);
  if (tableMissing) {
    return {
      ok: false,
      source: "demo",
      reason: "table_missing",
      message: "The rsvps table is missing. Run Supabase migrations before using live RSVP data.",
    };
  }

  const columnsMissing =
    /column.*does not exist|internal_notes|contacted_at|rsvps\.status/i.test(message);
  if (columnsMissing) {
    return {
      ok: false,
      source: "demo",
      reason: "columns_missing",
      message:
        "RSVP management columns are missing. Run supabase/migrations/20260702100000_rsvp_management_columns.sql.",
    };
  }

  console.error("[dashboard-rsvp] Query failed:", message, code);
  return {
    ok: false,
    source: "demo",
    reason: "query_failed",
    message: "Could not load RSVP data. Showing demo records until the issue is resolved.",
  };
}

/**
 * Fetch all RSVPs for the committee dashboard via service role (server-only).
 * TODO(platform-auth): Gate behind authenticated committee roles before public launch.
 */
export async function fetchDashboardRsvps(): Promise<FetchDashboardRsvpsResult> {
  const env = getSupabaseEnvPresence();
  if (!env.allPresent) {
    return {
      ok: false,
      source: "demo",
      reason: "missing_env",
      message: "Supabase is not configured. Add env vars to load live RSVP submissions.",
    };
  }

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("rsvps")
      .select(
        "id, full_name, email, phone, number_of_attendees, ticket_type, notes, created_at, status, internal_notes, contacted_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      return classifyQueryError(error.message, error.code ?? undefined);
    }

    return {
      ok: true,
      source: "live",
      records: (data ?? []).map((row) => mapRow(row as RsvpRow)),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return classifyQueryError(message);
  }
}

function contactedAtForStatus(status: RsvpStatus, existing: string | null): string | null {
  if (status === "new") return null;
  if (status === "contacted") return new Date().toISOString();
  return existing;
}

/** Update RSVP workflow status — server-only. */
export async function updateDashboardRsvpStatus(
  id: string,
  status: RsvpStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Missing RSVP id." };

  const env = getSupabaseEnvPresence();
  if (!env.allPresent) {
    return { ok: false, error: "Supabase is not configured." };
  }

  try {
    const supabase = createServiceRoleClient();

    const { data: existing, error: fetchError } = await supabase
      .from("rsvps")
      .select("contacted_at")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      console.error("[dashboard-rsvp] Status fetch error:", fetchError.message);
      return { ok: false, error: "Could not find this RSVP." };
    }
    if (!existing) {
      return { ok: false, error: "RSVP not found." };
    }

    const contacted_at = contactedAtForStatus(
      status,
      (existing as { contacted_at: string | null }).contacted_at,
    );

    const { error } = await supabase
      .from("rsvps")
      .update({ status, contacted_at })
      .eq("id", id);

    if (error) {
      console.error("[dashboard-rsvp] Status update error:", error.message);
      return { ok: false, error: "Could not update status. Check migrations are applied." };
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[dashboard-rsvp] Status update failed:", message);
    return { ok: false, error: "Unexpected error updating status." };
  }
}

/** Update internal committee notes — server-only. */
export async function updateDashboardRsvpInternalNote(
  id: string,
  internalNotes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Missing RSVP id." };

  const trimmed = internalNotes.trim();
  if (trimmed.length > 4000) {
    return { ok: false, error: "Internal note is too long (maximum 4000 characters)." };
  }

  const env = getSupabaseEnvPresence();
  if (!env.allPresent) {
    return { ok: false, error: "Supabase is not configured." };
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("rsvps")
      .update({ internal_notes: trimmed.length > 0 ? trimmed : null })
      .eq("id", id);

    if (error) {
      console.error("[dashboard-rsvp] Note update error:", error.message);
      return { ok: false, error: "Could not save internal note." };
    }

    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[dashboard-rsvp] Note update failed:", message);
    return { ok: false, error: "Unexpected error saving note." };
  }
}
