"use server";

import { headers } from "next/headers";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { dispatchRsvpNotifications } from "@/platform/engines/notifications/dispatch";
import { submitRsvpToDatabase } from "@/platform/engines/rsvp/submit";
import type { RsvpFormValues } from "@/platform/engines/rsvp/schema";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/activity/log";
import { getFeatureFlags } from "@/lib/feature-flags";

export type SubmitRsvpState =
  | { ok: true; emailSent?: boolean; registrationReference?: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof RsvpFormValues, string>> };

/**
 * Server Action — thin adapter over Promax RSVP + Notification engines.
 */
export async function submitRsvp(raw: unknown): Promise<SubmitRsvpState> {
  if (!getFeatureFlags().PUBLIC_REGISTRATION_OPEN) {
    return {
      ok: false,
      error:
        "Register Interest is temporarily closed. Please check back soon or contact the committee.",
    };
  }

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
    entityId: result.id || undefined,
    metadata: {
      email: result.record.email,
      reference: result.record.registration_reference,
      source: "public",
    },
  });

  let emailSent = false;
  try {
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.email_attempted",
      entityType: "rsvp",
      entityId: result.id || undefined,
    });
    const notify = await dispatchRsvpNotifications(event, result.record);
    emailSent = notify.emailSent;
    await logActivity({
      eventSlug: event.slug,
      action: emailSent ? "rsvp.email_sent" : "rsvp.email_failed",
      entityType: "rsvp",
      entityId: result.id || undefined,
    });
  } catch (e) {
    console.warn("[submitRsvp] Notification dispatch error (non-fatal):", e);
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.email_failed",
      entityType: "rsvp",
      entityId: result.id || undefined,
    });
  }

  return {
    ok: true,
    emailSent,
    registrationReference: result.record.registration_reference,
  };
}
