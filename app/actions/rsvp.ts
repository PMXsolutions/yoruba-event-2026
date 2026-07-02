"use server";

import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { dispatchRsvpNotifications } from "@/platform/engines/notifications/dispatch";
import { submitRsvpToDatabase } from "@/platform/engines/rsvp/submit";
import type { RsvpFormValues } from "@/platform/engines/rsvp/schema";

export type SubmitRsvpState =
  | { ok: true; emailSent?: boolean }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof RsvpFormValues, string>> };

/**
 * Server Action — thin adapter over Promax RSVP + Notification engines.
 */
export async function submitRsvp(raw: unknown): Promise<SubmitRsvpState> {
  const event = getActiveEventConfig();
  const result = await submitRsvpToDatabase(raw, event);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  // Non-blocking: RSVP succeeds even if email fails
  let emailSent = false;
  try {
    const notify = await dispatchRsvpNotifications(event, result.record);
    emailSent = notify.emailSent;
  } catch (e) {
    console.warn("[submitRsvp] Notification dispatch error (non-fatal):", e);
  }

  return { ok: true, emailSent };
}
