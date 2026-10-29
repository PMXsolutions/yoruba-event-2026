import "server-only";
import { randomUUID } from "node:crypto";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import {
  createRsvpFormSchema,
  fieldErrorsFromZod,
  toRsvpRecord,
  type RsvpFormValues,
  type RsvpRecord,
} from "@/platform/engines/rsvp/schema";
import { isSupabaseConnectivityFailure, supabaseErrorText } from "@/lib/supabase/connectivity";
import {
  isMissingRsvpCommsColumn,
  withoutRsvpCommsColumns,
} from "@/platform/engines/rsvp/columns";
import { mapConfigError, mapSupabaseRsvpError } from "@/platform/engines/rsvp/errors";
import type { EventConfig } from "@/platform/core/types/event";
import { getFeatureFlags } from "@/platform/core/flags";

export type SubmitRsvpResult =
  | { ok: true; record: RsvpRecord }
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
  const flags = getFeatureFlags();
  if (!flags.publicRegistrationOpen) {
    return {
      ok: false,
      error:
        "Registration of interest is temporarily closed. Please check back soon or contact us by email.",
      errorCode: "REGISTRATION_CLOSED",
    };
  }

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

  const record = { ...toRsvpRecord(parsed.data, event.slug), id: randomUUID() };

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

    if (withSlug.error && isSupabaseConnectivityFailure(supabaseErrorText(withSlug.error))) {
      console.error(
        "[rsvp-engine] Supabase lookup failed:",
        withSlug.error.message,
        withSlug.error.code ?? "",
      );
      const mapped = mapSupabaseRsvpError(
        supabaseErrorText(withSlug.error),
        withSlug.error.code ?? undefined,
      );
      return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
    }

    if (withSlug.error && /event_slug/i.test(withSlug.error.message)) {
      const fallback = await supabase
        .from("rsvps")
        .select("id, registration_reference")
        .eq("email", record.email)
        .gte("created_at", since)
        .limit(1)
        .maybeSingle();
      if (fallback.error && isSupabaseConnectivityFailure(supabaseErrorText(fallback.error))) {
        const mapped = mapSupabaseRsvpError(
          supabaseErrorText(fallback.error),
          fallback.error.code ?? undefined,
        );
        return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
      }
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

    // Prefer storing consent and pending delivery together. Databases created before
    // the communication migration reject those columns; save the registration anyway.
    const payload: Record<string, unknown> = { ...record, email_status: "pending" };
    let { error } = await supabase.from("rsvps").insert(payload);
    if (error && isMissingRsvpCommsColumn(supabaseErrorText(error))) {
      console.warn(
        "[rsvp-engine] Communication columns are missing; saving registration without them.",
      );
      ({ error } = await supabase.from("rsvps").insert(withoutRsvpCommsColumns(payload)));
    }

    if (error) {
      console.error("[rsvp-engine] Supabase insert error:", error.message, error.code ?? "");
      const mapped = mapSupabaseRsvpError(supabaseErrorText(error), error.code ?? undefined);
      return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
    }

    return {
      ok: true,
      record,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[rsvp-engine] Unexpected error:", msg);
    const mapped = mapConfigError(msg);
    return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
  }
}
