"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  toggleDashboardRsvpTag,
  updateDashboardRsvpCommitteeNote,
  updateDashboardRsvpStatus,
  fetchDashboardRsvpById,
} from "@/platform/engines/dashboard/rsvp/queries";
import { RSVP_STATUSES, RSVP_TAGS } from "@/platform/engines/dashboard/rsvp/types";
import { requireAuth } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/activity/log";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getFeatureFlags } from "@/platform/core/flags";
import { dispatchRsvpNotifications } from "@/platform/engines/notifications/dispatch";

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

  const result = await toggleDashboardRsvpTag(parsedId.data, parsedTag.data);
  if (result.ok) {
    revalidatePath("/dashboard/rsvps");
  }
  return result.ok ? { ok: true } : result;
}

/**
 * Resend confirmation email for a single registrant.
 * Does not send mass communications.
 */
export async function resendRsvpConfirmationEmailAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const fetched = await fetchDashboardRsvpById(parsedId.data);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const event = getActiveEventConfig();
  const r = fetched.record;
  const record = {
    id: r.id,
    full_name: r.fullName,
    email: r.email,
    phone: r.phone,
    number_of_attendees: r.numberOfAttendees,
    ticket_type: r.ticketType ?? event.ticketTypes[0] ?? "General admission",
    notes: r.notes,
    event_slug: event.slug,
    registration_reference: r.registrationReference ?? "",
    status: "new" as const,
    email_consent: true,
    sms_consent: r.smsConsent,
    marketing_consent: r.marketingConsent,
  };

  try {
    const notify = await dispatchRsvpNotifications(event, record, { channels: ["email"] });
    await logActivity({
      eventSlug: event.slug,
      action: "email.confirmation.resend",
      entityType: "rsvp",
      entityId: r.id,
      actorId: auth.user.id,
      metadata: { emailStatus: notify.emailStatus },
    });
    revalidatePath("/dashboard/rsvps");
    if (!notify.emailSent) {
      return {
        ok: false,
        error:
          notify.emailStatus === "not_configured"
            ? "Email is not configured."
            : "Confirmation email could not be sent. RSVP record is unchanged.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Confirmation email could not be sent." };
  }
}

/**
 * Send SMS confirmation for a single registrant (requires consent + SMS enabled).
 */
export async function sendRsvpConfirmationSmsAction(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const flags = getFeatureFlags();
  if (!flags.smsEnabled) {
    return { ok: false, error: "SMS is disabled. Enable SMS_ENABLED and configure Twilio." };
  }

  const fetched = await fetchDashboardRsvpById(parsedId.data);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const r = fetched.record;
  if (!r.smsConsent) {
    return { ok: false, error: "This registrant has not consented to SMS." };
  }
  if (!r.phone) {
    return { ok: false, error: "No phone number on this registration." };
  }

  const event = getActiveEventConfig();
  const record = {
    id: r.id,
    full_name: r.fullName,
    email: r.email,
    phone: r.phone,
    number_of_attendees: r.numberOfAttendees,
    ticket_type: r.ticketType ?? event.ticketTypes[0] ?? "General admission",
    notes: r.notes,
    event_slug: event.slug,
    registration_reference: r.registrationReference ?? "",
    status: "new" as const,
    email_consent: false,
    sms_consent: true,
    marketing_consent: r.marketingConsent,
  };

  try {
    const notify = await dispatchRsvpNotifications(event, record, { channels: ["sms"] });
    await logActivity({
      eventSlug: event.slug,
      action: "sms.confirmation.manual",
      entityType: "rsvp",
      entityId: r.id,
      actorId: auth.user.id,
      metadata: { smsStatus: notify.smsStatus },
    });
    revalidatePath("/dashboard/rsvps");
    if (!notify.smsSent) {
      return {
        ok: false,
        error:
          notify.smsStatus === "not_configured"
            ? "Twilio is not configured."
            : "SMS could not be sent. RSVP record is unchanged.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "SMS could not be sent." };
  }
}
