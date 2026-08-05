import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import {
  type DashboardRsvpRecord,
  type FetchDashboardRsvpsResult,
  type RsvpStatus,
  type RsvpTag,
  isRsvpStatus,
  isRsvpTag,
  normalizeTags,
} from "@/platform/engines/dashboard/rsvp/types";
import { getActiveEventConfig } from "@/platform/core/config/active-event";

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
  committee_notes?: string | null;
  internal_notes?: string | null;
  contacted_at: string | null;
  tags?: string[] | null;
  registration_reference?: string | null;
  accessibility_requirements?: string | null;
  dietary_requirements?: string | null;
  source?: string | null;
};

const RSVP_SELECT =
  "id, full_name, email, phone, number_of_attendees, ticket_type, notes, created_at, status, committee_notes, internal_notes, contacted_at, tags, registration_reference, accessibility_requirements, dietary_requirements, source";

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
    committeeNotes: row.committee_notes ?? row.internal_notes ?? null,
    contactedAt: row.contacted_at,
    tags: normalizeTags(row.tags),
    registrationReference: row.registration_reference ?? null,
    accessibilityRequirements: row.accessibility_requirements ?? null,
    dietaryRequirements: row.dietary_requirements ?? null,
    source: row.source ?? null,
  };
}

function classifyQueryError(message: string, code?: string): FetchDashboardRsvpsResult {
  const tableMissing =
    code === "42P01" || /relation|does not exist|schema cache|PGRST205/i.test(message);
  if (tableMissing) {
    return {
      ok: false,
      reason: "table_missing",
      message: "RSVP table is not available. Run Supabase migrations.",
    };
  }

  const columnsMissing =
    /column.*does not exist|committee_notes|internal_notes|contacted_at|tags|rsvps\.status/i.test(
      message,
    );
  if (columnsMissing) {
    return {
      ok: false,
      reason: "columns_missing",
      message: "RSVP CRM columns are missing. Apply the latest migrations.",
    };
  }

  console.error("[dashboard-rsvp] Query failed:", message, code);
  return {
    ok: false,
    reason: "query_failed",
    message: "Unable to load RSVPs right now.",
  };
}

/** Fetch all RSVPs for the active event via service role (server-only). */
export async function fetchDashboardRsvps(): Promise<FetchDashboardRsvpsResult> {
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return {
      ok: false,
      reason: "missing_env",
      message: "Database is not configured.",
    };
  }

  const event = getActiveEventConfig();

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("rsvps")
      .select(RSVP_SELECT)
      .eq("event_slug", event.slug)
      .order("created_at", { ascending: false });

    if (error) {
      // Fallback without event_slug filter if column not yet migrated
      if (/event_slug/i.test(error.message)) {
        const fallback = await supabase
          .from("rsvps")
          .select(RSVP_SELECT.replace(", registration_reference", ""))
          .order("created_at", { ascending: false });
        if (fallback.error) return classifyQueryError(fallback.error.message, fallback.error.code);
        return {
          ok: true,
          records: (fallback.data ?? []).map((row) => mapRow(row as unknown as RsvpRow)),
        };
      }
      return classifyQueryError(error.message, error.code ?? undefined);
    }

    return {
      ok: true,
      records: (data ?? []).map((row) => mapRow(row as RsvpRow)),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return classifyQueryError(message);
  }
}

function contactedAtForStatus(status: RsvpStatus, existing: string | null): string | null {
  if (status === "new" || status === "cancelled") return null;
  if (status === "contacted") return new Date().toISOString();
  return existing;
}

export async function updateDashboardRsvpStatus(
  id: string,
  status: RsvpStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Record not found." };

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return { ok: false, error: "Database not connected." };
  }

  try {
    const supabase = createServiceRoleClient();

    const { data: existing, error: fetchError } = await supabase
      .from("rsvps")
      .select("contacted_at")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { ok: false, error: "Record not found." };
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
      return { ok: false, error: "Could not update status." };
    }

    return { ok: true };
  } catch (e) {
    console.error("[dashboard-rsvp] Status update failed:", e);
    return { ok: false, error: "Could not update status." };
  }
}

export async function updateDashboardRsvpCommitteeNote(
  id: string,
  committeeNotes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Record not found." };

  const trimmed = committeeNotes.trim();
  if (trimmed.length > 4000) {
    return { ok: false, error: "Committee note is too long (maximum 4,000 characters)." };
  }

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return { ok: false, error: "Database not connected." };
  }

  try {
    const supabase = createServiceRoleClient();
    const payload = { committee_notes: trimmed.length > 0 ? trimmed : null };

    let { error } = await supabase.from("rsvps").update(payload).eq("id", id);

    if (error && /committee_notes/i.test(error.message)) {
      ({ error } = await supabase
        .from("rsvps")
        .update({ internal_notes: payload.committee_notes })
        .eq("id", id));
    }

    if (error) {
      console.error("[dashboard-rsvp] Note update error:", error.message);
      return { ok: false, error: "Could not save committee note." };
    }

    return { ok: true };
  } catch (e) {
    console.error("[dashboard-rsvp] Note update failed:", e);
    return { ok: false, error: "Could not save committee note." };
  }
}

export async function toggleDashboardRsvpTag(
  id: string,
  tag: RsvpTag,
): Promise<{ ok: true; tags: RsvpTag[] } | { ok: false; error: string }> {
  if (!id || !isRsvpTag(tag)) {
    return { ok: false, error: "Invalid tag." };
  }

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return { ok: false, error: "Database not connected." };
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: existing, error: fetchError } = await supabase
      .from("rsvps")
      .select("tags")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return { ok: false, error: "Record not found." };
    }

    const current = normalizeTags((existing as { tags: string[] | null }).tags);
    const next = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];

    const { error } = await supabase.from("rsvps").update({ tags: next }).eq("id", id);

    if (error) {
      console.error("[dashboard-rsvp] Tag update error:", error.message);
      return { ok: false, error: "Could not update tags." };
    }

    return { ok: true, tags: next };
  } catch (e) {
    console.error("[dashboard-rsvp] Tag update failed:", e);
    return { ok: false, error: "Could not update tags." };
  }
}

export type CommitteeRsvpInput = {
  fullName: string;
  email: string;
  phone?: string;
  numberOfAttendees: number;
  ticketType: string;
  status: RsvpStatus;
  tags: RsvpTag[];
  committeeNotes?: string;
  accessibilityRequirements?: string;
  dietaryRequirements?: string;
  notes?: string;
  source?: string;
  createdBy?: string | null;
};

export async function createCommitteeRsvp(
  input: CommitteeRsvpInput,
): Promise<
  | { ok: true; id: string; registrationReference: string; record: DashboardRsvpRecord }
  | { ok: false; error: string }
> {
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ok: false, error: "Database not connected." };

  const event = getActiveEventConfig();
  const { generateRegistrationReference } = await import("@/platform/engines/rsvp/schema");
  const registrationReference = generateRegistrationReference(event.slug);

  const payload = {
    full_name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || null,
    number_of_attendees: input.numberOfAttendees,
    ticket_type: input.ticketType,
    notes: input.notes?.trim() || null,
    status: input.status,
    tags: input.tags,
    committee_notes: input.committeeNotes?.trim() || null,
    accessibility_requirements: input.accessibilityRequirements?.trim() || null,
    dietary_requirements: input.dietaryRequirements?.trim() || null,
    event_slug: event.slug,
    registration_reference: registrationReference,
    source: input.source ?? "committee",
    created_by: input.createdBy ?? null,
    contacted_at: input.status === "contacted" || input.status === "confirmed"
      ? new Date().toISOString()
      : null,
  };

  try {
    const supabase = createServiceRoleClient();
    let { data, error } = await supabase.from("rsvps").insert(payload).select(RSVP_SELECT).single();

    if (error && /accessibility_requirements|dietary_requirements|source|created_by/i.test(error.message)) {
      const legacy = {
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        number_of_attendees: payload.number_of_attendees,
        ticket_type: payload.ticket_type,
        notes: payload.notes,
        status: payload.status,
        tags: payload.tags,
        committee_notes: payload.committee_notes,
        event_slug: payload.event_slug,
        registration_reference: payload.registration_reference,
        contacted_at: payload.contacted_at,
      };
      ({ data, error } = await supabase.from("rsvps").insert(legacy).select(RSVP_SELECT).single());
    }

    if (error || !data) {
      console.error("[dashboard-rsvp] Committee create failed:", error?.message);
      return { ok: false, error: "Could not register guest." };
    }

    const record = mapRow(data as RsvpRow);
    return { ok: true, id: record.id, registrationReference, record };
  } catch (e) {
    console.error("[dashboard-rsvp] Committee create error:", e);
    return { ok: false, error: "Could not register guest." };
  }
}

export async function updateDashboardRsvpDetails(
  id: string,
  input: {
    fullName: string;
    email: string;
    phone?: string;
    numberOfAttendees: number;
    ticketType: string;
    notes?: string;
    accessibilityRequirements?: string;
    dietaryRequirements?: string;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Record not found." };
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ok: false, error: "Database not connected." };

  const payload = {
    full_name: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || null,
    number_of_attendees: input.numberOfAttendees,
    ticket_type: input.ticketType,
    notes: input.notes?.trim() || null,
    accessibility_requirements: input.accessibilityRequirements?.trim() || null,
    dietary_requirements: input.dietaryRequirements?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createServiceRoleClient();
    let { error } = await supabase.from("rsvps").update(payload).eq("id", id);
    if (error && /accessibility_requirements|dietary_requirements|updated_at/i.test(error.message)) {
      const legacy = {
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        number_of_attendees: payload.number_of_attendees,
        ticket_type: payload.ticket_type,
        notes: payload.notes,
      };
      ({ error } = await supabase.from("rsvps").update(legacy).eq("id", id));
    }
    if (error) {
      console.error("[dashboard-rsvp] Edit failed:", error.message);
      return { ok: false, error: "Could not update guest details." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update guest details." };
  }
}

export async function fetchDashboardRsvpById(
  id: string,
): Promise<{ ok: true; record: DashboardRsvpRecord } | { ok: false; error: string }> {
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ok: false, error: "Database not connected." };
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.from("rsvps").select(RSVP_SELECT).eq("id", id).maybeSingle();
    if (error || !data) return { ok: false, error: "Record not found." };
    return { ok: true, record: mapRow(data as RsvpRow) };
  } catch {
    return { ok: false, error: "Record not found." };
  }
}
