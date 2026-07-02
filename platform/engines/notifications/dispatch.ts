import "server-only";

import { sendRsvpConfirmationEmail } from "@/platform/engines/notifications/email/resend-client";
import type { EventConfig } from "@/platform/core/types/event";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";

/**
 * Notification Engine — dispatches post-registration communications.
 * Email failures are logged only; never block the primary RSVP flow.
 */
export async function dispatchRsvpNotifications(
  event: EventConfig,
  record: RsvpRecord,
): Promise<{ emailSent: boolean }> {
  const emailResult = await sendRsvpConfirmationEmail({ event, record });
  if (!emailResult.ok && emailResult.reason === "SEND_FAILED") {
    console.warn("[notification-engine] RSVP saved but confirmation email failed.");
  }
  // TODO(platform): SMS via Twilio when NOTIFY_SMS_ENABLED=true — see docs/SMS.md
  return { emailSent: emailResult.ok };
}
