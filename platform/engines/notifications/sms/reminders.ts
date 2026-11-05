import "server-only";

import type { EventConfig } from "@/platform/core/types/event";
import { logActivity } from "@/lib/activity/log";
import type { DashboardRsvpRecord } from "@/platform/engines/dashboard/rsvp/types";
import { updateRsvpSmsReminder } from "@/platform/engines/notifications/delivery";
import { firstNameFromFullName, eventWebsiteUrl } from "@/platform/engines/notifications/email/templates/shared";
import { renderSmsTemplate } from "@/platform/engines/notifications/sms/format";
import { resolveSmsSettings } from "@/platform/engines/notifications/sms/settings-store";
import { sendSmsMessage } from "@/platform/engines/notifications/sms/twilio-client";

export const SMS_REMINDER_BATCH_SIZE = 40;

export function buildSmsReminder(event: EventConfig, fullName: string, template: string): string {
  return renderSmsTemplate(template, {
    firstName: firstNameFromFullName(fullName),
    eventName: event.name,
    date: event.heroDateDisplay,
    location: event.location,
    website: eventWebsiteUrl(event),
  });
}

export function isReminderEligible(record: DashboardRsvpRecord): boolean {
  return Boolean(record.smsConsent && record.phone && record.status !== "cancelled" && record.smsReminderStatus !== "sent");
}

export async function sendRsvpReminderSms(input: {
  event: EventConfig;
  record: DashboardRsvpRecord;
  actorId?: string | null;
  /** Single sends may repeat. Batch sends skip anyone already reminded. */
  allowRepeat?: boolean;
}): Promise<{ ok: true; status: "sent" } | { ok: false; error: string; status: string }> {
  const settings = await resolveSmsSettings();
  if (!settings.enabled) {
    return { ok: false, status: "disabled", error: "SMS is turned off. Enable it in Settings." };
  }
  if (!settings.remindersEnabled) {
    return { ok: false, status: "disabled", error: "SMS reminders are turned off. Enable them in Settings." };
  }
  if (!settings.ready) {
    return {
      ok: false,
      status: "not_configured",
      error: settings.provider === "twilio" ? "Twilio is not configured." : "DirectSMS is not configured. Add the gateway username and password in Settings.",
    };
  }
  if (!input.allowRepeat && input.record.smsReminderStatus === "sent") {
    return { ok: false, status: "skipped", error: "This registrant already received the SMS reminder." };
  }
  if (!input.record.smsConsent) {
    return { ok: false, status: "skipped", error: "This registrant has not consented to SMS." };
  }
  if (!input.record.phone) {
    return { ok: false, status: "skipped", error: "No phone number on this registration." };
  }
  if (input.record.status === "cancelled") {
    return { ok: false, status: "skipped", error: "Cancelled registrations are not reminded." };
  }

  const body = buildSmsReminder(input.event, input.record.fullName, settings.reminderTemplate);
  const result = await sendSmsMessage({
    to: input.record.phone,
    body,
    eventSlug: input.event.slug,
  });

  if (result.ok) {
    await updateRsvpSmsReminder({ rsvpId: input.record.id, status: "sent", providerId: result.sid ?? null });
    await logActivity({
      eventSlug: input.event.slug,
      action: "sms.reminder.sent",
      entityType: "rsvp",
      entityId: input.record.id,
      actorId: input.actorId,
      metadata: { sid: result.sid ?? null },
    });
    return { ok: true, status: "sent" };
  }

  const status = result.reason === "NOT_CONFIGURED" || result.reason === "DISABLED" ? result.reason === "DISABLED" ? "disabled" : "not_configured" : "failed";
  if (status === "failed") {
    await updateRsvpSmsReminder({ rsvpId: input.record.id, status: "failed" });
  }
  await logActivity({
    eventSlug: input.event.slug,
    action: `sms.reminder.${status}`,
    entityType: "rsvp",
    entityId: input.record.id,
    actorId: input.actorId,
    metadata: { reason: result.reason },
  });
  return {
    ok: false,
    status,
    error:
      status === "not_configured"
        ? "SMS is not configured."
        : status === "disabled"
          ? "SMS is turned off. Enable it in Settings."
          : "SMS reminder could not be sent.",
  };
}

export async function sendRsvpReminderBatch(input: {
  event: EventConfig;
  records: DashboardRsvpRecord[];
  actorId?: string | null;
}): Promise<{ sent: number; failed: number; remaining: number }> {
  const waiting = input.records.filter(isReminderEligible);
  const batch = waiting.slice(0, SMS_REMINDER_BATCH_SIZE);
  let sent = 0;
  let failed = 0;
  for (const record of batch) {
    try {
      const result = await sendRsvpReminderSms({
        event: input.event,
        record,
        actorId: input.actorId,
      });
      if (result.ok) sent += 1;
      else {
        failed += 1;
        if (result.status === "disabled" || result.status === "not_configured") break;
      }
    } catch (error) {
      failed += 1;
      console.error("[sms] Reminder batch item failed:", error instanceof Error ? error.message : "unknown");
    }
  }
  return { sent, failed, remaining: Math.max(0, waiting.length - sent) };
}
