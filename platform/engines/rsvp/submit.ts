import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import {
  createRsvpFormSchema,
  fieldErrorsFromZod,
  toRsvpRecord,
  type RsvpFormValues,
} from "@/platform/engines/rsvp/schema";
import { mapConfigError, mapSupabaseRsvpError } from "@/platform/engines/rsvp/errors";
import type { EventConfig } from "@/platform/core/types/event";

export type SubmitRsvpResult =
  | { ok: true; record: ReturnType<typeof toRsvpRecord> }
  | {
      ok: false;
      error: string;
      errorCode: string;
      fieldErrors?: Partial<Record<keyof RsvpFormValues, string>>;
    };

/**
 * Promax RSVP Engine — validates and persists interest registrations.
 * Event-agnostic; ticket types supplied via EventConfig.
 */
export async function submitRsvpToDatabase(
  raw: unknown,
  event: EventConfig,
): Promise<SubmitRsvpResult> {
  const schema = createRsvpFormSchema(event.ticketTypes);
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      errorCode: "VALIDATION_FAILED",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return {
      ok: false,
      error: mapConfigError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        .userMessage,
      errorCode: "MISSING_CONFIG",
    };
  }

  const record = toRsvpRecord(parsed.data, event.slug);

  try {
    const supabase = createServiceRoleClient();

    // Soft duplicate prevention: same email + event within last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let existing: { id: string; registration_reference?: string | null } | null = null;

    const withSlug = await supabase
      .from("rsvps")
      .select("id, registration_reference")
      .eq("event_slug", event.slug)
      .eq("email", record.email)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();

    if (withSlug.error && /event_slug/i.test(withSlug.error.message)) {
      const fallback = await supabase
        .from("rsvps")
        .select("id, registration_reference")
        .eq("email", record.email)
        .gte("created_at", since)
        .limit(1)
        .maybeSingle();
      existing = fallback.data;
    } else if (!withSlug.error) {
      existing = withSlug.data;
    }

    if (existing) {
      return {
        ok: false,
        error:
          "You have already registered recently with this email. Please check your inbox or contact us if you need to update your details.",
        errorCode: "DUPLICATE_REGISTRATION",
      };
    }

    let { error } = await supabase.from("rsvps").insert(record);

    // Compatibility: older schemas without production columns
    if (error && /event_slug|registration_reference/i.test(error.message)) {
      const legacy = {
        full_name: record.full_name,
        email: record.email,
        phone: record.phone,
        number_of_attendees: record.number_of_attendees,
        ticket_type: record.ticket_type,
        notes: record.notes,
        status: record.status,
      };
      ({ error } = await supabase.from("rsvps").insert(legacy));
    }

    if (error) {
      console.error("[rsvp-engine] Supabase insert error:", error.message, error.code);
      const mapped = mapSupabaseRsvpError(error.message, error.code ?? undefined);
      return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
    }

    return { ok: true, record };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[rsvp-engine] Unexpected error:", msg);
    const mapped = mapConfigError(msg);
    return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
  }
}
