import { assertPermission } from "@/lib/auth/rbac";
import "server-only";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbOne, dbQuery } from "@/lib/db/query";
import { asIso, jsonText } from "@/lib/db/values";
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
import { isMissingRsvpCommsColumn } from "@/platform/engines/rsvp/columns";

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

const RSVP_SELECT_WITHOUT_COMMS =
  "id, full_name, email, phone, number_of_attendees, ticket_type, notes, created_at, status, committee_notes, internal_notes, contacted_at, tags, registration_reference";

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
    createdAt: asIso(row.created_at) ?? "",
    status,
    committeeNotes: row.committee_notes ?? row.internal_notes ?? null,
    contactedAt: asIso(row.contacted_at),
    tags: normalizeTags(row.tags),
    registrationReference: row.registration_reference ?? null,
    emailConsent: row.email_consent ?? true,
    smsConsent: row.sms_consent ?? false,
    marketingConsent: row.marketing_consent ?? false,
    emailStatus,
    emailSentAt: asIso(row.email_sent_at),
    smsStatus,
    smsSentAt: asIso(row.sms_sent_at),
  };
}

async function selectRsvpRows(where: string, params: Record<string, unknown>) {
  const order = `SELECT %COLUMNS% FROM rsvps WHERE ${where} ORDER BY created_at DESC`;
  try {
    const rows = await dbQuery<RsvpRow>(order.replace("%COLUMNS%", RSVP_SELECT), params);
    return { rows, error: null as string | null };
  } catch (error) {
    const message = errorMessage(error);
    if (!isMissingRsvpCommsColumn(message)) return { rows: [] as RsvpRow[], error: message };
    try {
      const rows = await dbQuery<RsvpRow>(order.replace("%COLUMNS%", RSVP_SELECT_WITHOUT_COMMS), params);
      return { rows, error: null as string | null };
    } catch (legacyError) {
      return { rows: [] as RsvpRow[], error: errorMessage(legacyError) };
    }
  }
}

function classifyQueryError(message: string, code?: string): FetchDashboardRsvpsResult {
  if (/column\s+\S+\s+does not exist|Could not find the '.+' column/i.test(message)) {
    return {
      ok: false,
      reason: "columns_missing",
      message: "RSVP CRM columns are missing. Apply the latest migrations.",
    };
  }
  const tableMissing =
    code === "42P01" ||
    code === "208" ||
    /relation\s+["']?\w+["']?\s+does not exist|schema cache|PGRST205|Invalid object name/i.test(message);
  if (tableMissing) {
    return {
      ok: false,
      reason: "table_missing",
      message: "RSVP table is not available. Apply sql/mssql/001_create_and_migrate.sql.",
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
  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return {
      ok: false,
      reason: "missing_env",
      message: "Database is not configured.",
    };
  }

  const event = getActiveEventConfig();

  try {
    const loaded = await selectRsvpRows(`event_slug = @slug`, { slug: event.slug });
    if (loaded.error) return classifyQueryError(loaded.error);
    const rows = loaded.rows;

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

  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return { ok: false, error: "Database not connected." };
  }

  try {
    const loaded = await selectRsvpRows(`id = @id`, { id });
    const row = loaded.rows[0];
    if (loaded.error || !row) {
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

  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return { ok: false, error: "Database not connected." };
  }

  try {
    const existing = await dbOne<{ contacted_at: string | Date | null }>(
      `SELECT contacted_at FROM rsvps WHERE id = @id`,
      { id },
    );
    if (!existing) return { ok: false, error: "Record not found." };

    const contactedAt = contactedAtForStatus(status, asIso(existing.contacted_at));
    const updated = await dbExec(
      `UPDATE rsvps SET status = @status, contacted_at = @contactedAt, updated_at = SYSDATETIMEOFFSET() WHERE id = @id`,
      { id, status, contactedAt: contactedAt ? new Date(contactedAt) : null },
    );
    if (updated === 0) return { ok: false, error: "Could not update status." };

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

  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return { ok: false, error: "Database not connected." };
  }

  try {
    const notes = trimmed.length > 0 ? trimmed : null;
    try {
      const updated = await dbExec(
        `UPDATE rsvps SET committee_notes = @notes, updated_at = SYSDATETIMEOFFSET() WHERE id = @id`,
        { id, notes },
      );
      if (updated === 0) return { ok: false, error: "Could not save committee note." };
    } catch (noteError) {
      if (!/committee_notes/i.test(errorMessage(noteError))) throw noteError;
      const updated = await dbExec(
        `UPDATE rsvps SET internal_notes = @notes, updated_at = SYSDATETIMEOFFSET() WHERE id = @id`,
        { id, notes },
      );
      if (updated === 0) return { ok: false, error: "Could not save committee note." };
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

  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return { ok: false, error: "Database not connected." };
  }

  try {
    const existing = await dbOne<{ tags: string | string[] | null }>(
      `SELECT tags FROM rsvps WHERE id = @id`,
      { id },
    );
    if (!existing) return { ok: false, error: "Record not found." };

    const current = normalizeTags(existing.tags);
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    const updated = await dbExec(
      `UPDATE rsvps SET tags = @tags, updated_at = SYSDATETIMEOFFSET() WHERE id = @id`,
      { id, tags: jsonText(next) },
    );
    if (updated === 0) return { ok: false, error: "Could not update tags." };

    return { ok: true, tags: next };
  } catch (e) {
    console.error("[dashboard-rsvp] Tag update failed:", e);
    return { ok: false, error: "Could not update tags." };
  }
}
