"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { fieldErrorsFromZod, rsvpFormSchema, type RsvpFormValues } from "@/lib/validation/rsvp";

export type SubmitRsvpState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof RsvpFormValues, string>> };

function mapSupabaseError(message: string): string {
  if (/duplicate|unique/i.test(message)) {
    return "We already have a recent registration with this email. If you need to change details, please contact us.";
  }
  if (/violates|constraint|check/i.test(message)) {
    return "Your submission could not be saved. Please check your answers and try again.";
  }
  return "Something went wrong while saving your RSVP. Please try again in a moment.";
}

export async function submitRsvp(raw: unknown): Promise<SubmitRsvpState> {
  const parsed = rsvpFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const d = parsed.data;

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("rsvps").insert({
      full_name: d.fullName,
      email: d.email.toLowerCase(),
      phone: d.phone ?? null,
      number_of_attendees: d.attendees,
      ticket_type: d.ticketType,
      notes: d.notes ?? null,
    });

    if (error) {
      console.error("[rsvp] Supabase insert error:", error.message);
      return {
        ok: false,
        error: mapSupabaseError(error.message),
      };
    }

    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[rsvp] Unexpected error:", msg);
    if (msg.includes("Missing NEXT_PUBLIC_SUPABASE") || msg.includes("SUPABASE_SERVICE_ROLE")) {
      return {
        ok: false,
        error:
          "RSVP is not configured on this deployment yet. Please try again later or contact the organisers by email.",
      };
    }
    return {
      ok: false,
      error: "We could not reach our servers. Check your connection and try again.",
    };
  }
}
