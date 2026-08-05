"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/activity/log";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getFeatureFlags } from "@/lib/feature-flags";
import {
  assignGuestSeat,
  createSeatingTable,
  setCheckIn,
  upsertFloorPlan,
} from "@/platform/engines/seating/queries";
import { SEATING_ZONES } from "@/platform/engines/seating/types";

function seatingGuard() {
  if (!getFeatureFlags().SEATING_ENABLED) {
    return { ok: false as const, error: "Seating is disabled for this deployment." };
  }
  return { ok: true as const };
}

export async function saveFloorPlanAction(raw: unknown) {
  const auth = await requireAuth("programme.write");
  if (!auth.ok) {
    const rsvpAuth = await requireAuth("rsvp.write");
    if (!rsvpAuth.ok) return { ok: false as const, error: rsvpAuth.message };
  }
  const gate = seatingGuard();
  if (!gate.ok) return gate;

  const schema = z.object({
    title: z.string().max(200).default("Main hall"),
    fileUrl: z.string().url().or(z.string().min(3).max(2000)),
    fileLabel: z.string().max(200).optional(),
    mimeHint: z.string().max(100).optional(),
    notes: z.string().max(2000).optional(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Provide a valid floor plan URL or reference." };

  const result = await upsertFloorPlan(parsed.data);
  if (result.ok) {
    revalidatePath("/dashboard/seating");
    revalidatePath("/seat");
  }
  return result;
}

export async function createTableAction(raw: unknown) {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  const gate = seatingGuard();
  if (!gate.ok) return gate;

  const schema = z.object({
    name: z.string().trim().min(1).max(80),
    zone: z.string().trim().min(1).max(40),
    capacity: z.coerce.number().int().min(1).max(100),
    notes: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Check table name, zone and capacity." };
  if (!(SEATING_ZONES as readonly string[]).includes(parsed.data.zone) && parsed.data.zone.length < 2) {
    return { ok: false as const, error: "Choose a valid zone." };
  }

  const result = await createSeatingTable(parsed.data);
  if (result.ok) revalidatePath("/dashboard/seating");
  return result;
}

export async function assignSeatAction(raw: unknown) {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  const gate = seatingGuard();
  if (!gate.ok) return gate;

  const schema = z.object({
    rsvpId: z.string().uuid(),
    tableId: z.string().uuid(),
    seatLabel: z.string().trim().min(1).max(20),
    zone: z.string().trim().max(40).optional(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Select guest, table and seat." };

  const result = await assignGuestSeat(parsed.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.seat_assigned",
      entityType: "rsvp",
      entityId: parsed.data.rsvpId,
      actorId: auth.user.id,
      metadata: {
        table: parsed.data.tableId,
        seat: parsed.data.seatLabel,
        zone: parsed.data.zone,
      },
    });
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.qr_generated",
      entityType: "rsvp",
      entityId: parsed.data.rsvpId,
      actorId: auth.user.id,
      metadata: { qrTokenSuffix: result.qrToken.slice(-6) },
    });
    revalidatePath("/dashboard/seating");
    revalidatePath("/dashboard/check-in");
    revalidatePath("/dashboard/rsvps");
    revalidatePath("/seat");
  }
  return result;
}

export async function setCheckInAction(assignmentId: string, checkedIn: boolean) {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  const gate = getFeatureFlags().QR_CHECKIN_ENABLED
    ? seatingGuard()
    : { ok: false as const, error: "Check-in is disabled." };
  if (!gate.ok) return gate;

  const idParse = z.string().uuid().safeParse(assignmentId);
  if (!idParse.success) return { ok: false as const, error: "Invalid assignment." };

  const result = await setCheckIn(idParse.data, checkedIn, auth.user.id);
  if (result.ok) {
    const event = getActiveEventConfig();
    try {
      const { createServiceRoleClient } = await import("@/lib/supabase/admin");
      const supabase = createServiceRoleClient();
      const { data } = await supabase
        .from("seating_assignments")
        .select("rsvp_id")
        .eq("id", idParse.data)
        .maybeSingle();
      const rsvpId = (data as { rsvp_id?: string } | null)?.rsvp_id;
      await logActivity({
        eventSlug: event.slug,
        action: checkedIn ? "rsvp.checked_in" : "rsvp.check_in_undone",
        entityType: "rsvp",
        entityId: rsvpId ?? idParse.data,
        actorId: auth.user.id,
      });
    } catch {
      /* non-fatal */
    }
    revalidatePath("/dashboard/check-in");
    revalidatePath("/dashboard/seating");
    revalidatePath("/dashboard/rsvps");
  }
  return result;
}
