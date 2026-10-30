/** Columns added by the RSVP communication migrations. Older databases do not have them. */
export const RSVP_COMMS_COLUMNS = [
  "email_consent",
  "sms_consent",
  "marketing_consent",
  "email_status",
  "email_sent_at",
  "email_provider_id",
  "sms_status",
  "sms_sent_at",
  "sms_provider_id",
] as const;

export type RsvpCommsColumn = (typeof RSVP_COMMS_COLUMNS)[number];

/** PostgREST and Postgres names for one missing column, if the message is about that. */
export function missingRsvpColumn(message: string): string | null {
  const quoted = message.match(/Could not find the '([^']+)' column/i);
  if (quoted?.[1]) return quoted[1];
  const invalid = message.match(/Invalid column name '([^']+)'/i);
  if (invalid?.[1]) return invalid[1];
  const sql = message.match(/column\s+(?:[\w"]+\.)?"?(\w+)"?\s+does not exist/i);
  if (sql?.[1]) return sql[1];
  if (!/schema cache|PGRST204/i.test(message)) return null;
  return RSVP_COMMS_COLUMNS.find((column) => new RegExp(`\\b${column}\\b`, "i").test(message)) ?? null;
}

export function isMissingRsvpCommsColumn(message: string): boolean {
  const column = missingRsvpColumn(message);
  return column != null && (RSVP_COMMS_COLUMNS as readonly string[]).includes(column);
}

export function withoutRsvpCommsColumns<T extends Record<string, unknown>>(row: T): T {
  const copy = { ...row };
  for (const column of RSVP_COMMS_COLUMNS) {
    delete copy[column];
  }
  return copy;
}
