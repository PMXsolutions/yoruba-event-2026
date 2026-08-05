"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createCommitteeRsvp,
  fetchDashboardRsvpById,
  toggleDashboardRsvpTag,
  updateDashboardRsvpCommitteeNote,
  updateDashboardRsvpDetails,
  updateDashboardRsvpStatus,
} from "@/platform/engines/dashboard/rsvp/queries";
import { RSVP_STATUSES, RSVP_TAGS } from "@/platform/engines/dashboard/rsvp/types";
import { requireAuth } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/activity/log";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { dispatchRsvpNotifications } from "@/platform/engines/notifications/dispatch";
import { fetchEntityActivity } from "@/lib/activity/queries";
import { TICKET_TYPES } from "@/lib/site";

const statusSchema = z.enum(RSVP_STATUSES);
const tagSchema = z.enum(RSVP_TAGS);
const noteSchema = z.string().max(4000);
const idSchema = z.string().uuid();

export async function updateRsvpStatusAction(
  id: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) return { ok: false, error: "Invalid status." };

  const result = await updateDashboardRsvpStatus(parsedId.data, parsedStatus.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.status_updated",
      entityType: "rsvp",
      entityId: parsedId.data,
      actorId: auth.user.id,
      metadata: { status: parsedStatus.data },
    });
    revalidatePath("/dashboard/rsvps");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/seating");
    revalidatePath("/dashboard/check-in");
  }
  return result;
}

export async function updateRsvpCommitteeNoteAction(
  id: string,
  committeeNotes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const parsedNote = noteSchema.safeParse(committeeNotes);
  if (!parsedNote.success) return { ok: false, error: "Note is too long." };

  const result = await updateDashboardRsvpCommitteeNote(parsedId.data, parsedNote.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.note_updated",
      entityType: "rsvp",
      entityId: parsedId.data,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/rsvps");
  }
  return result;
}

export async function toggleRsvpTagAction(
  id: string,
  tag: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const parsedTag = tagSchema.safeParse(tag);
  if (!parsedTag.success) return { ok: false, error: "Invalid tag." };

  const before = await fetchDashboardRsvpById(parsedId.data);
  const result = await toggleDashboardRsvpTag(parsedId.data, parsedTag.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    const added = before.ok ? !before.record.tags.includes(parsedTag.data) : true;
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.tag_updated",
      entityType: "rsvp",
      entityId: parsedId.data,
      actorId: auth.user.id,
      metadata: { tag: parsedTag.data, added },
    });
    revalidatePath("/dashboard/rsvps");
  }
  return result.ok ? { ok: true } : result;
}

const guestSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  numberOfAttendees: z.coerce.number().int().min(1).max(50),
  ticketType: z.string().min(1),
  status: z.enum(RSVP_STATUSES).default("new"),
  tags: z.array(z.enum(RSVP_TAGS)).default([]),
  committeeNotes: z.string().max(4000).optional(),
  accessibilityRequirements: z.string().max(2000).optional(),
  dietaryRequirements: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  source: z.string().max(40).optional(),
  sendEmail: z.boolean().optional(),
});

export async function registerCommitteeGuestAction(
  raw: unknown,
): Promise<
  | { ok: true; id: string; registrationReference: string; emailSent?: boolean }
  | { ok: false; error: string }
> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsed = guestSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please correct the guest details." };
  if (!(TICKET_TYPES as readonly string[]).includes(parsed.data.ticketType)) {
    return { ok: false, error: "Please select a valid ticket preference." };
  }

  const result = await createCommitteeRsvp({
    ...parsed.data,
    createdBy: auth.user.id,
  });
  if (!result.ok) return result;

  const event = getActiveEventConfig();
  await logActivity({
    eventSlug: event.slug,
    action: "rsvp.committee_created",
    entityType: "rsvp",
    entityId: result.id,
    actorId: auth.user.id,
    metadata: { reference: result.registrationReference, source: parsed.data.source ?? "committee" },
  });

  let emailSent = false;
  if (parsed.data.sendEmail !== false) {
    try {
      await logActivity({
        eventSlug: event.slug,
        action: "rsvp.email_attempted",
        entityType: "rsvp",
        entityId: result.id,
        actorId: auth.user.id,
      });
      const notify = await dispatchRsvpNotifications(event, {
        full_name: result.record.fullName,
        email: result.record.email,
        phone: result.record.phone,
        number_of_attendees: result.record.numberOfAttendees,
        ticket_type: result.record.ticketType ?? parsed.data.ticketType,
        notes: result.record.notes,
        event_slug: event.slug,
        registration_reference: result.registrationReference,
        status: "new",
      });
      emailSent = notify.emailSent;
      await logActivity({
        eventSlug: event.slug,
        action: emailSent ? "rsvp.email_sent" : "rsvp.email_failed",
        entityType: "rsvp",
        entityId: result.id,
        actorId: auth.user.id,
      });
    } catch {
      await logActivity({
        eventSlug: event.slug,
        action: "rsvp.email_failed",
        entityType: "rsvp",
        entityId: result.id,
        actorId: auth.user.id,
      });
    }
  }

  revalidatePath("/dashboard/rsvps");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/seating");
  return { ok: true, id: result.id, registrationReference: result.registrationReference, emailSent };
}

const editSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  numberOfAttendees: z.coerce.number().int().min(1).max(50),
  ticketType: z.string().min(1),
  notes: z.string().max(2000).optional(),
  accessibilityRequirements: z.string().max(2000).optional(),
  dietaryRequirements: z.string().max(2000).optional(),
});

export async function editRsvpDetailsAction(
  raw: unknown,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsed = editSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please correct the guest details." };
  if (!(TICKET_TYPES as readonly string[]).includes(parsed.data.ticketType)) {
    return { ok: false, error: "Please select a valid ticket preference." };
  }

  const { id, ...rest } = parsed.data;
  const result = await updateDashboardRsvpDetails(id, rest);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.updated",
      entityType: "rsvp",
      entityId: id,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/rsvps");
    revalidatePath("/dashboard/seating");
    revalidatePath("/dashboard/check-in");
  }
  return result;
}

export async function resendRsvpConfirmationAction(
  id: string,
): Promise<{ ok: true; emailSent: boolean } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const fetched = await fetchDashboardRsvpById(parsedId.data);
  if (!fetched.ok) return fetched;

  const event = getActiveEventConfig();
  const r = fetched.record;

  await logActivity({
    eventSlug: event.slug,
    action: "rsvp.email_attempted",
    entityType: "rsvp",
    entityId: r.id,
    actorId: auth.user.id,
  });

  try {
    const notify = await dispatchRsvpNotifications(event, {
      full_name: r.fullName,
      email: r.email,
      phone: r.phone,
      number_of_attendees: r.numberOfAttendees,
      ticket_type: r.ticketType ?? "General admission",
      notes: r.notes,
      event_slug: event.slug,
      registration_reference: r.registrationReference ?? "Pending",
      status: "new",
    });
    await logActivity({
      eventSlug: event.slug,
      action: notify.emailSent ? "rsvp.email_resent" : "rsvp.email_failed",
      entityType: "rsvp",
      entityId: r.id,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/rsvps");
    return { ok: true, emailSent: notify.emailSent };
  } catch {
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.email_failed",
      entityType: "rsvp",
      entityId: r.id,
      actorId: auth.user.id,
    });
    return { ok: false, error: "Could not send confirmation email." };
  }
}

export async function fetchRsvpActivityAction(id: string) {
  const auth = await requireAuth("rsvp.read");
  if (!auth.ok) return { ok: false as const, error: auth.message, items: [] };
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false as const, error: "Invalid record.", items: [] };
  const items = await fetchEntityActivity("rsvp", parsedId.data);
  return { ok: true as const, items };
}
