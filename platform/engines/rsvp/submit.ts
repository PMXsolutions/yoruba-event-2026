import "server-only";
import { randomUUID } from "node:crypto";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage, isDatabaseConnectivityFailure } from "@/lib/db/connectivity";
import { dbExec, dbOne } from "@/lib/db/query";
import { jsonText } from "@/lib/db/values";
import {
  createRsvpFormSchema,
  fieldErrorsFromZod,
  toRsvpRecord,
  type RsvpFormValues,
  type RsvpRecord,
} from "@/platform/engines/rsvp/schema";
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

const INSERT_WITH_COMMS = `
  INSERT INTO rsvps (
    id, full_name, email, phone, number_of_attendees, ticket_type, notes,
    event_slug, registration_reference, status, email_consent, sms_consent,
    marketing_consent, email_status, tags
  ) VALUES (
    @id, @full_name, @email, @phone, @number_of_attendees, @ticket_type, @notes,
    @event_slug, @registration_reference, @status, @email_consent, @sms_consent,
    @marketing_consent, @email_status, @tags
  )`;

const INSERT_WITHOUT_COMMS = `
  INSERT INTO rsvps (
    id, full_name, email, phone, number_of_attendees, ticket_type, notes,
    event_slug, registration_reference, status, tags
  ) VALUES (
    @id, @full_name, @email, @phone, @number_of_attendees, @ticket_type, @notes,
    @event_slug, @registration_reference, @status, @tags
  )`;

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

  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return {
      ok: false,
      error: mapConfigError("Missing MSSQL connection settings").userMessage,
      errorCode: "MISSING_CONFIG",
    };
  }

  const record = { ...toRsvpRecord(parsed.data, event.slug), id: randomUUID() };

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let existing: { id: string; registration_reference?: string | null } | null = null;
    try {
      existing = await dbOne(
        `SELECT TOP 1 id, registration_reference
         FROM rsvps
         WHERE event_slug = @slug AND email = @email AND created_at >= @since`,
        { slug: event.slug, email: record.email, since },
      );
    } catch (lookupError) {
      const message = errorMessage(lookupError);
      if (isDatabaseConnectivityFailure(message)) {
        const mapped = mapSupabaseRsvpError(message);
        return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
      }
      if (/event_slug/i.test(message) && isMissingRsvpCommsColumn(message) === false && /Invalid column name 'event_slug'/i.test(message)) {
        existing = await dbOne(
          `SELECT TOP 1 id, registration_reference FROM rsvps WHERE email = @email AND created_at >= @since`,
          { email: record.email, since },
        );
      } else if (!/Invalid column name 'event_slug'/i.test(message)) {
        const mapped = mapSupabaseRsvpError(message);
        return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
      }
    }

    if (existing) {
      return {
        ok: false,
        error:
          "You have already registered recently with this email. Please check your inbox or contact us if you need to update your details.",
        errorCode: "DUPLICATE_REGISTRATION",
      };
    }

    const payload: Record<string, unknown> = {
      ...record,
      email_status: "pending",
      tags: jsonText([]),
    };
    try {
      await dbExec(INSERT_WITH_COMMS, payload);
    } catch (insertError) {
      const message = errorMessage(insertError);
      if (!isMissingRsvpCommsColumn(message)) {
        console.error("[rsvp-engine] SQL Server insert error:", message);
        const mapped = mapSupabaseRsvpError(message);
        return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
      }
      console.warn("[rsvp-engine] Communication columns are missing; saving registration without them.");
      await dbExec(INSERT_WITHOUT_COMMS, withoutRsvpCommsColumns(payload));
    }

    return { ok: true, record };
  } catch (e) {
    const msg = errorMessage(e);
    console.error("[rsvp-engine] Unexpected error:", msg);
    const mapped = isDatabaseConnectivityFailure(msg) ? mapSupabaseRsvpError(msg) : mapConfigError(msg);
    return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
  }
}
