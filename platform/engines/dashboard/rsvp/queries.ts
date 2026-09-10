import { assertPermission } from "@/lib/auth/rbac";
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

import {
  isEmailDeliveryStatus,
  isSmsDeliveryStatus,
  type EmailDeliveryStatus,
  type SmsDeliveryStatus,
} from "@/platform/engines/notifications/types";

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
  email_consent?: boolean | null;
  sms_consent?: boolean | null;
  marketing_consent?: boolean | null;
  email_status?: string | null;
  email_sent_at?: string | null;
  sms_status?: string | null;
  sms_sent_at?: string | null;
};

const RSVP_SELECT =
  "id, full_name, email, phone, number_of_attendees, ticket_type, notes, created_at, status, committee_notes, internal_notes, contacted_at, tags, registration_reference, email_consent, sms_consent, marketing_consent, email_status, email_sent_at, sms_status, sms_sent_at";

function mapRow(row: RsvpRow): DashboardRsvpRecord {
  const status = row.status && isRsvpStatus(row.status) ? row.status : "new";
  const emailStatus: EmailDeliveryStatus =
    row.email_status && isEmailDeliveryStatus(row.email_status)
      ? row.email_status
      : "not_attempted";
  const smsStatus: SmsDeliveryStatus =
    row.sms_status && isSmsDeliveryStatus(row.sms_status) ? row.sms_status : "not_attempted";
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
    emailConsent: row.email_consent ?? true,
    smsConsent: row.sms_consent ?? false,
    marketingConsent: row.marketing_consent ?? false,
    emailStatus,
    emailSentAt: row.email_sent_at ?? null,
    smsStatus,
    smsSentAt: row.sms_sent_at ?? null,
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
    /column.*does not exist|committee_notes|internal_notes|contacted_at|tags|rsvps\.status|email_consent|sms_consent|email_status|sms_status/i.test(
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
  await assertPermission("rsvp.read");
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
    const primary = await supabase
      .from("rsvps")
      .select(RSVP_SELECT)
      .eq("event_slug", event.slug)
      .order("created_at", { ascending: false });

    const rows = primary.data;
    if (primary.error) return classifyQueryError(primary.error.message, primary.error.code);

    return {
      ok: true,
      records: (rows ?? []).map((row) => mapRow(row as RsvpRow)),
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return classifyQueryError(message);
  }
}

/** Fetch a single RSVP for committee communication actions. */
export async function fetchDashboardRsvpById(
  id: string,
): Promise<{ ok: true; record: DashboardRsvpRecord } | { ok: false; error: string }> {
  await assertPermission("rsvp.read");
  if (!id) return { ok: false, error: "Record not found." };

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return { ok: false, error: "Database not connected." };
  }

  try {
    const supabase = createServiceRoleClient();
    const primary = await supabase
      .from("rsvps")
      .select(RSVP_SELECT)
      .eq("id", id)
      .maybeSingle();

    const row = primary.data;
    const error = primary.error;

    if (error || !row) {
      return { ok: false, error: "Record not found." };
    }

    return { ok: true, record: mapRow(row as RsvpRow) };
  } catch {
    return { ok: false, error: "Record not found." };
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
