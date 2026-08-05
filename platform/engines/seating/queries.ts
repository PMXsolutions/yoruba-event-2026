import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import type {
  SeatLookupResult,
  SeatingAssignment,
  SeatingTable,
  VenueFloorPlan,
} from "@/platform/engines/seating/types";

function notReady() {
  return { ok: false as const, error: "Database not connected." };
}

export async function fetchFloorPlans(): Promise<VenueFloorPlan[]> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return [];
  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("venue_floor_plans")
      .select("id, title, file_url, file_label, mime_hint, notes, is_active, created_at")
      .eq("event_slug", event.slug)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[seating] floor plans:", error.message);
      return [];
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      fileUrl: r.file_url,
      fileLabel: r.file_label,
      mimeHint: r.mime_hint,
      notes: r.notes,
      isActive: r.is_active,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}

export async function upsertFloorPlan(input: {
  title: string;
  fileUrl: string;
  fileLabel?: string;
  mimeHint?: string;
  notes?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return notReady();
  const event = getActiveEventConfig();
  const url = input.fileUrl.trim();
  if (!url) return { ok: false, error: "Floor plan URL or reference is required." };

  try {
    const supabase = createServiceRoleClient();
    await supabase
      .from("venue_floor_plans")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("event_slug", event.slug)
      .eq("is_active", true);

    const { data, error } = await supabase
      .from("venue_floor_plans")
      .insert({
        event_slug: event.slug,
        title: input.title.trim() || "Main hall",
        file_url: url,
        file_label: input.fileLabel?.trim() || null,
        mime_hint: input.mimeHint?.trim() || null,
        notes: input.notes?.trim() || null,
        is_active: true,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: "Could not save floor plan reference." };
    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false, error: "Could not save floor plan reference." };
  }
}

export async function fetchSeatingTables(): Promise<SeatingTable[]> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return [];
  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    const { data: tables, error } = await supabase
      .from("seating_tables")
      .select("id, name, zone, capacity, sort_order, notes")
      .eq("event_slug", event.slug)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      console.warn("[seating] tables:", error.message);
      return [];
    }

    const { data: assignments } = await supabase
      .from("seating_assignments")
      .select("table_id")
      .eq("event_slug", event.slug);

    const counts = new Map<string, number>();
    for (const a of assignments ?? []) {
      if (!a.table_id) continue;
      counts.set(a.table_id, (counts.get(a.table_id) ?? 0) + 1);
    }

    return (tables ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      zone: t.zone,
      capacity: t.capacity,
      sortOrder: t.sort_order,
      notes: t.notes,
      assignedCount: counts.get(t.id) ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function createSeatingTable(input: {
  name: string;
  zone: string;
  capacity: number;
  notes?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return notReady();
  const event = getActiveEventConfig();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Table name is required." };
  const capacity = Math.min(100, Math.max(1, Math.floor(input.capacity) || 8));

  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("seating_tables")
      .insert({
        event_slug: event.slug,
        name,
        zone: input.zone.trim() || "General",
        capacity,
        notes: input.notes?.trim() || null,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: "Could not create table." };
    return { ok: true, id: data.id as string };
  } catch {
    return { ok: false, error: "Could not create table." };
  }
}

export async function updateSeatingTable(
  id: string,
  input: { name?: string; zone?: string; capacity?: number; notes?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return notReady();
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { ok: false, error: "Table name is required." };
    payload.name = name;
  }
  if (input.zone !== undefined) payload.zone = input.zone.trim() || "General";
  if (input.capacity !== undefined) {
    payload.capacity = Math.min(100, Math.max(1, Math.floor(input.capacity) || 8));
  }
  if (input.notes !== undefined) payload.notes = input.notes?.trim() || null;

  if (Object.keys(payload).length === 0) return { ok: false, error: "Nothing to update." };

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("seating_tables").update(payload).eq("id", id);
    if (error) return { ok: false, error: "Could not update table." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update table." };
  }
}

export async function deleteSeatingTable(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return notReady();
  try {
    const supabase = createServiceRoleClient();
    const { count } = await supabase
      .from("seating_assignments")
      .select("id", { count: "exact", head: true })
      .eq("table_id", id);
    if ((count ?? 0) > 0) {
      return { ok: false, error: "Unassign all guests from this table before deleting it." };
    }
    const { error } = await supabase.from("seating_tables").delete().eq("id", id);
    if (error) return { ok: false, error: "Could not delete table." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete table." };
  }
}

export async function unassignSeat(
  assignmentId: string,
): Promise<{ ok: true; rsvpId: string | null } | { ok: false; error: string }> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return { ok: false, error: "Database not connected." };
  try {
    const supabase = createServiceRoleClient();
    const { data } = await supabase
      .from("seating_assignments")
      .select("rsvp_id")
      .eq("id", assignmentId)
      .maybeSingle();
    const rsvpId = (data as { rsvp_id?: string } | null)?.rsvp_id ?? null;

    const { error } = await supabase.from("seating_assignments").delete().eq("id", assignmentId);
    if (error) return { ok: false, error: "Could not unassign seat." };
    return { ok: true, rsvpId };
  } catch {
    return { ok: false, error: "Could not unassign seat." };
  }
}

export async function fetchSeatingAssignments(): Promise<SeatingAssignment[]> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return [];
  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("seating_assignments")
      .select(
        "id, rsvp_id, table_id, zone, seat_label, qr_token, checked_in_at, rsvps(full_name, email, registration_reference, accessibility_requirements, ticket_type), seating_tables(name)",
      )
      .eq("event_slug", event.slug)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[seating] assignments:", error.message);
      return [];
    }

    return (data ?? []).map((row) => {
      const rsvp = Array.isArray(row.rsvps) ? row.rsvps[0] : row.rsvps;
      const table = Array.isArray(row.seating_tables) ? row.seating_tables[0] : row.seating_tables;
      return {
        id: row.id,
        rsvpId: row.rsvp_id,
        tableId: row.table_id,
        zone: row.zone,
        seatLabel: row.seat_label,
        qrToken: row.qr_token,
        checkedInAt: row.checked_in_at,
        guestName: (rsvp as { full_name?: string } | null)?.full_name ?? "Guest",
        guestEmail: (rsvp as { email?: string } | null)?.email ?? "",
        registrationReference:
          (rsvp as { registration_reference?: string | null } | null)?.registration_reference ??
          null,
        accessibilityRequirements:
          (rsvp as { accessibility_requirements?: string | null } | null)
            ?.accessibility_requirements ?? null,
        ticketType: (rsvp as { ticket_type?: string | null } | null)?.ticket_type ?? null,
        tableName: (table as { name?: string } | null)?.name ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function assignGuestSeat(input: {
  rsvpId: string;
  tableId: string;
  seatLabel: string;
  zone?: string;
}): Promise<{ ok: true; qrToken: string; assignmentId: string } | { ok: false; error: string }> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return notReady();
  const event = getActiveEventConfig();
  if (!input.rsvpId || !input.tableId) return { ok: false, error: "Guest and table are required." };

  try {
    const supabase = createServiceRoleClient();
    const { data: table } = await supabase
      .from("seating_tables")
      .select("id, name, zone, capacity")
      .eq("id", input.tableId)
      .maybeSingle();
    if (!table) return { ok: false, error: "Table not found." };

    const { count } = await supabase
      .from("seating_assignments")
      .select("id", { count: "exact", head: true })
      .eq("table_id", input.tableId);

    const { data: existingForGuest } = await supabase
      .from("seating_assignments")
      .select("id, table_id")
      .eq("rsvp_id", input.rsvpId)
      .maybeSingle();

    const occupied = count ?? 0;
    const replacingSame =
      existingForGuest && (existingForGuest as { table_id: string }).table_id === input.tableId;
    if (!replacingSame && occupied >= (table as { capacity: number }).capacity) {
      return { ok: false, error: "This table is at capacity." };
    }

    const zone = input.zone?.trim() || (table as { zone: string }).zone;
    const seatLabel = input.seatLabel.trim() || "1";
    const payload = {
      event_slug: event.slug,
      rsvp_id: input.rsvpId,
      table_id: input.tableId,
      zone,
      seat_label: seatLabel,
      updated_at: new Date().toISOString(),
    };

    let assignmentId: string;
    let qrToken: string;

    if (existingForGuest) {
      const { data, error } = await supabase
        .from("seating_assignments")
        .update(payload)
        .eq("id", (existingForGuest as { id: string }).id)
        .select("id, qr_token")
        .single();
      if (error) return { ok: false, error: "Could not update seat assignment." };
      assignmentId = data.id;
      qrToken = data.qr_token;
    } else {
      const { data, error } = await supabase
        .from("seating_assignments")
        .insert(payload)
        .select("id, qr_token")
        .single();
      if (error) return { ok: false, error: "Could not assign seat." };
      assignmentId = data.id;
      qrToken = data.qr_token;
    }

    return { ok: true, qrToken, assignmentId };
  } catch {
    return { ok: false, error: "Could not assign seat." };
  }
}

export async function setCheckIn(
  assignmentId: string,
  checkedIn: boolean,
  actorId?: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!getSupabaseEnvPresence().serviceRoleReady) return notReady();
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("seating_assignments")
      .update({
        checked_in_at: checkedIn ? new Date().toISOString() : null,
        checked_in_by: checkedIn ? actorId ?? null : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);
    if (error) return { ok: false, error: "Could not update check-in." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update check-in." };
  }
}

/** Public-safe lookup — returns one guest seat without exposing the full list. */
export async function lookupSeat(query: {
  name?: string;
  reference?: string;
  qrToken?: string;
}): Promise<{ ok: true; result: SeatLookupResult } | { ok: false; error: string }> {
  if (!getSupabaseEnvPresence().serviceRoleReady) {
    return { ok: false, error: "Seat lookup is temporarily unavailable." };
  }
  const event = getActiveEventConfig();
  const name = query.name?.trim().toLowerCase() ?? "";
  const reference = query.reference?.trim().toUpperCase() ?? "";
  const qrToken = query.qrToken?.trim() ?? "";

  if (!name && !reference && !qrToken) {
    return { ok: false, error: "Enter your name, booking reference, or scan your QR code." };
  }

  try {
    const supabase = createServiceRoleClient();
    let assignmentQuery = supabase
      .from("seating_assignments")
      .select(
        "zone, seat_label, checked_in_at, qr_token, rsvps!inner(full_name, ticket_type, registration_reference), seating_tables(name)",
      )
      .eq("event_slug", event.slug);

    if (qrToken) {
      assignmentQuery = assignmentQuery.eq("qr_token", qrToken);
    }

    const { data, error } = await assignmentQuery.limit(25);
    if (error) {
      console.warn("[seating] lookup:", error.message);
      return { ok: false, error: "Unable to look up seating right now." };
    }

    const matches = (data ?? []).filter((row) => {
      if (qrToken) return true;
      const rsvp = Array.isArray(row.rsvps) ? row.rsvps[0] : row.rsvps;
      const guestName = ((rsvp as { full_name?: string } | null)?.full_name ?? "").toLowerCase();
      const ref = (
        (rsvp as { registration_reference?: string | null } | null)?.registration_reference ?? ""
      ).toUpperCase();
      if (reference && ref === reference) return true;
      if (name && guestName === name) return true;
      if (name && guestName.includes(name) && name.length >= 4) return true;
      return false;
    });

    if (matches.length === 0) {
      return {
        ok: false,
        error: "No seat found. Check spelling or your registration reference, or ask a steward.",
      };
    }
    if (matches.length > 1 && !qrToken && !reference) {
      return {
        ok: false,
        error: "Multiple matches found. Please use your registration reference for an exact match.",
      };
    }

    const row = matches[0];
    const rsvp = Array.isArray(row.rsvps) ? row.rsvps[0] : row.rsvps;
    const table = Array.isArray(row.seating_tables) ? row.seating_tables[0] : row.seating_tables;

    const { data: plans } = await supabase
      .from("venue_floor_plans")
      .select("file_url")
      .eq("event_slug", event.slug)
      .eq("is_active", true)
      .limit(1);

    return {
      ok: true,
      result: {
        guestName: (rsvp as { full_name?: string } | null)?.full_name ?? "Guest",
        zone: row.zone,
        tableName: (table as { name?: string } | null)?.name ?? null,
        seatLabel: row.seat_label,
        ticketType: (rsvp as { ticket_type?: string | null } | null)?.ticket_type ?? null,
        registrationReference:
          (rsvp as { registration_reference?: string | null } | null)?.registration_reference ??
          null,
        floorPlanUrl: plans?.[0]?.file_url ?? null,
        checkedIn: Boolean(row.checked_in_at),
      },
    };
  } catch {
    return { ok: false, error: "Unable to look up seating right now." };
  }
}

/** Opaque QR payload — token only; attendee PII resolved server-side. */
export function buildQrPayload(qrToken: string, origin: string): string {
  return `${origin.replace(/\/$/, "")}/seat?t=${encodeURIComponent(qrToken)}`;
}
