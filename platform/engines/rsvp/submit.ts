import "server-only";
import { randomUUID } from "node:crypto";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage, isDatabaseConnectivityFailure } from "@/lib/db/connectivity";
import { dbExec, dbQuery } from "@/lib/db/query";
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
import { phoneKey } from "@/platform/engines/rsvp/phone";

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

type DuplicateResult = Extract<SubmitRsvpResult, { ok: false }>;

async function registrationsForEvent(slug: string): Promise<{ email: string; phone: string | null }[]> {
  try {
    return await dbQuery(
      `SELECT email, phone FROM rsvps WHERE event_slug = @slug`,
      { slug },
    );
  } catch (lookupError) {
    const message = errorMessage(lookupError);
    if (isDatabaseConnectivityFailure(message)) throw lookupError;
    if (/Invalid column name 'event_slug'/i.test(message)) {
      return dbQuery(`SELECT email, phone FROM rsvps`);
    }
    throw lookupError;
  }
}

async function findDuplicateRegistration(
  slug: string,
  email: string,
  phone: string | null,
): Promise<DuplicateResult | null> {
  let rows: { email: string; phone: string | null }[];
  try {
    rows = await registrationsForEvent(slug);
  } catch (lookupError) {
    const message = errorMessage(lookupError);
    const mapped = mapSupabaseRsvpError(message);
    return { ok: false, error: mapped.userMessage, errorCode: mapped.errorCode };
  }

  const emailTaken = rows.some((row) => row.email?.trim().toLowerCase() === email);
  if (emailTaken) {
    return {
      ok: false,
      error: "This email is already registered. Contact the committee if you need to update your details.",
      errorCode: "DUPLICATE_REGISTRATION",
      fieldErrors: { email: "This email is already registered." },
    };
  }

  const key = phoneKey(phone);
  if (key.length >= 8 && rows.some((row) => phoneKey(row.phone) === key)) {
    return {
      ok: false,
      error: "This phone number is already registered. Contact the committee if you need to update your details.",
      errorCode: "DUPLICATE_REGISTRATION",
      fieldErrors: { phone: "This phone number is already registered." },
    };
  }
  return null;
}

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
    const duplicate = await findDuplicateRegistration(event.slug, record.email, record.phone);
    if (duplicate) return duplicate;

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
