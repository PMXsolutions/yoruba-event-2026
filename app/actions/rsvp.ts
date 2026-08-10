"use server";

import { headers } from "next/headers";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getFeatureFlags } from "@/platform/core/flags";
import { dispatchRsvpNotifications } from "@/platform/engines/notifications/dispatch";
import { submitRsvpToDatabase } from "@/platform/engines/rsvp/submit";
import type { RsvpFormValues } from "@/platform/engines/rsvp/schema";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/activity/log";

export type SubmitRsvpState =
  | { ok: true; emailSent?: boolean; smsSent?: boolean; registrationReference?: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof RsvpFormValues, string>> };

/**
 * Server Action — thin adapter over Promax RSVP + Notification engines.
 * Always persists RSVP first; notifications never fail the public submission.
 */
export async function submitRsvp(raw: unknown): Promise<SubmitRsvpState> {
  const flags = getFeatureFlags();
  if (!flags.publicRegistrationOpen) {
    return {
      ok: false,
      error:
        "Registration of interest is temporarily closed. Please check back soon or contact us by email.",
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
    entityId: result.record.id,
    metadata: {
      email: result.record.email,
      reference: result.record.registration_reference,
      emailConsent: result.record.email_consent,
      smsConsent: result.record.sms_consent,
    },
  });

  let emailSent = false;
  let smsSent = false;
  try {
    const notify = await dispatchRsvpNotifications(event, result.record);
    emailSent = notify.emailSent;
    smsSent = notify.smsSent;
  } catch (e) {
    console.warn("[submitRsvp] Notification dispatch error (non-fatal):", e);
  }

  return {
    ok: true,
    emailSent,
    smsSent,
    registrationReference: result.record.registration_reference,
  };
}
