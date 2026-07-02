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
  if (!env.allPresent) {
    return {
      ok: false,
      error: mapConfigError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        .userMessage,
      errorCode: "MISSING_CONFIG",
    };
  }

  const record = toRsvpRecord(parsed.data);

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("rsvps").insert(record);

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
