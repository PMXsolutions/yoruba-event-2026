import "server-only";

import { sendRsvpConfirmationEmail } from "@/platform/engines/notifications/email/resend-client";
import type { EventConfig } from "@/platform/core/types/event";
import type { RsvpRecord } from "@/platform/engines/rsvp/schema";
import { getFeatureFlags } from "@/lib/feature-flags";

/**
 * Notification Engine — dispatches post-registration communications.
 * Email failures are logged only; never block the primary RSVP flow.
 */
export async function dispatchRsvpNotifications(
  event: EventConfig,
  record: RsvpRecord,
): Promise<{ emailSent: boolean }> {
  const flags = getFeatureFlags();
  if (!flags.EMAIL_CONFIRMATIONS_ENABLED) {
    return { emailSent: false };
  }
  const emailResult = await sendRsvpConfirmationEmail({ event, record });
  if (!emailResult.ok && emailResult.reason === "SEND_FAILED") {
    console.warn("[notification-engine] RSVP saved but confirmation email failed.");
  }
  // SMS: platform/engines/notifications/sms/dispatch.ts behind SMS_ENABLED
  return { emailSent: emailResult.ok };
}
