import "server-only";

import { sendRsvpConfirmationEmail, sendSponsorConfirmationEmail } from "@/platform/engines/notifications/email/smtp-client";
import type { EventConfig } from "@/platform/core/types/event";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";

/**
 * Notification Engine — dispatches post-registration communications via SMTP.
 * Email failures are logged only; never block the primary flow.
 */
export async function dispatchRsvpNotifications(
  event: EventConfig,
  record: RsvpRecord,
  registrationReference: string,
): Promise<{ emailSent: boolean }> {
  const emailResult = await sendRsvpConfirmationEmail({ event, record, registrationReference });
  if (!emailResult.ok && emailResult.reason === "SEND_FAILED") {
    console.warn("[notification-engine] RSVP saved but confirmation email failed.");
  }
  return { emailSent: emailResult.ok };
}

export async function dispatchSponsorNotifications(
  event: EventConfig,
  sponsor: { company: string; contactPerson: string; email: string; packageName: string },
): Promise<{ emailSent: boolean }> {
  const emailResult = await sendSponsorConfirmationEmail({
    company: sponsor.company,
    contactPerson: sponsor.contactPerson,
    email: sponsor.email,
    packageName: sponsor.packageName,
    eventName: event.name,
    organisation: event.organisation,
    contactEmail: event.contact.email,
  });
  return { emailSent: emailResult.ok };
}
