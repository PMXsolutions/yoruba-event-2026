"use server";

import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { dispatchRsvpNotifications } from "@/platform/engines/notifications/dispatch";
import { submitRsvpToDatabase } from "@/platform/engines/rsvp/submit";
import type { RsvpFormValues } from "@/platform/engines/rsvp/schema";

export type RsvpConfirmationData = {
  registrationReference: string;
  fullName: string;
  email: string;
  attendees: number;
  ticketType: string;
};

export type SubmitRsvpState =
  | { ok: true; emailSent?: boolean; confirmation: RsvpConfirmationData }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof RsvpFormValues, string>> };

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

  let emailSent = false;
  try {
    const notify = await dispatchRsvpNotifications(
      event,
      result.record,
      result.registrationReference,
    );
    emailSent = notify.emailSent;
  } catch (e) {
    console.warn("[submitRsvp] Notification dispatch error (non-fatal):", e);
  }

  return {
    ok: true,
    emailSent,
    confirmation: {
      registrationReference: result.registrationReference,
      fullName: result.record.full_name,
      email: result.record.email,
      attendees: result.record.number_of_attendees,
      ticketType: result.record.ticket_type,
    },
  };
}
