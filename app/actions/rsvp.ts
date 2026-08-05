"use server";

import { headers } from "next/headers";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { dispatchRsvpNotifications } from "@/platform/engines/notifications/dispatch";
import { submitRsvpToDatabase } from "@/platform/engines/rsvp/submit";
import type { RsvpFormValues } from "@/platform/engines/rsvp/schema";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/activity/log";

export type SubmitRsvpState =
  | { ok: true; emailSent?: boolean; registrationReference?: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof RsvpFormValues, string>> };

/**
 * Server Action — thin adapter over Promax RSVP + Notification engines.
 */
export async function submitRsvp(raw: unknown): Promise<SubmitRsvpState> {
  const hdrs = await headers();
  const rate = checkRateLimit(clientKeyFromHeaders(hdrs, "rsvp"), 8, 60_000);
  if (!rate.allowed) {
    return {
      ok: false,
      error: "Too many registration attempts. Please wait a minute and try again.",
    };
  }

  const event = getActiveEventConfig();
  const result = await submitRsvpToDatabase(raw, event);

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
      fieldErrors: result.fieldErrors,
    };
  }

  await logActivity({
    eventSlug: event.slug,
    action: "rsvp.created",
    entityType: "rsvp",
    metadata: {
      email: result.record.email,
      reference: result.record.registration_reference,
    },
  });

  let emailSent = false;
  try {
    const notify = await dispatchRsvpNotifications(event, result.record);
    emailSent = notify.emailSent;
  } catch (e) {
    console.warn("[submitRsvp] Notification dispatch error (non-fatal):", e);
  }

  return {
    ok: true,
    emailSent,
    registrationReference: result.record.registration_reference,
  };
}
