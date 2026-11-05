"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  toggleDashboardRsvpTag,
  updateDashboardRsvpCommitteeNote,
  updateDashboardRsvpStatus,
  fetchDashboardRsvpById,
  fetchDashboardRsvps,
} from "@/platform/engines/dashboard/rsvp/queries";
import { RSVP_STATUSES, RSVP_TAGS } from "@/platform/engines/dashboard/rsvp/types";
import { requireAuth } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/activity/log";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { dispatchRsvpNotifications } from "@/platform/engines/notifications/dispatch";
import { resolveSmsSettings } from "@/platform/engines/notifications/sms/settings-store";
import { sendRsvpReminderBatch, sendRsvpReminderSms } from "@/platform/engines/notifications/sms/reminders";

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
    email_consent: r.emailConsent,
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
            : "Confirmation email could not be sent. Registration is saved; check communication status.",
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

  const sms = await resolveSmsSettings();
  if (!sms.enabled) {
    return { ok: false, error: "SMS is turned off. Enable it in Settings." };
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
            ? "SMS is not configured. Open Settings and add DirectSMS or Twilio."
            : "SMS could not be sent. Registration is saved; check communication status.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "SMS could not be sent." };
  }
}

/**
 * Send the event reminder to one registrant who consented to SMS.
 */
export async function sendRsvpReminderSmsAction(
  id: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };
  const limit = checkRateLimit(`sms-reminder:${auth.user.id}`, 30, 60_000);
  if (!limit.allowed) return { ok: false, error: "Too many SMS reminders. Wait a moment and try again." };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const fetched = await fetchDashboardRsvpById(parsedId.data);
  if (!fetched.ok) return { ok: false, error: fetched.error };

  const event = getActiveEventConfig();
  const result = await sendRsvpReminderSms({
    event,
    record: fetched.record,
    actorId: auth.user.id,
    allowRepeat: true,
  });
  revalidatePath("/dashboard/rsvps");
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, message: `SMS reminder sent to ${fetched.record.fullName}.` };
}

/**
 * Send the event reminder to registrants who opted in and have not already received it.
 * Each run sends a limited batch so a large list can be continued safely.
 */
export async function sendEventReminderSmsAction(): Promise<
  { ok: true; message: string } | { ok: false; error: string }
> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };
  const limit = checkRateLimit(`sms-reminder-batch:${auth.user.id}`, 3, 60_000);
  if (!limit.allowed) return { ok: false, error: "Reminder sending is paused for a minute. Try again shortly." };

  const fetched = await fetchDashboardRsvps();
  if (!fetched.ok) return { ok: false, error: fetched.message };

  const event = getActiveEventConfig();
  const result = await sendRsvpReminderBatch({
    event,
    records: fetched.records,
    actorId: auth.user.id,
  });
  await logActivity({
    eventSlug: event.slug,
    action: "sms.reminder.batch",
    entityType: "rsvp",
    actorId: auth.user.id,
    metadata: result,
  });
  revalidatePath("/dashboard/rsvps");

  if (result.sent === 0 && result.failed === 0) {
    return { ok: true, message: "No registrants are waiting for an SMS reminder." };
  }
  if (result.sent === 0) {
    return { ok: false, error: "SMS reminders could not be sent. Check Settings and try one registration first." };
  }
  const waiting = result.remaining > 0 ? ` ${result.remaining} still waiting — run reminders again to continue.` : "";
  const failed = result.failed > 0 ? ` ${result.failed} could not be sent.` : "";
  return { ok: true, message: `Sent ${result.sent} SMS reminder${result.sent === 1 ? "" : "s"}.${failed}${waiting}` };
}
