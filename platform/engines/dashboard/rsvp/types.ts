/** Dashboard RSVP management types — server-side only. */

export const RSVP_STATUSES = ["new", "contacted", "confirmed"] as const;

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

export type DashboardRsvpRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  numberOfAttendees: number;
  ticketType: string | null;
  notes: string | null;
  createdAt: string;
  status: RsvpStatus;
  internalNotes: string | null;
  contactedAt: string | null;
};

export type RsvpDataSource = "live" | "demo";

export type FetchDashboardRsvpsResult =
  | { ok: true; source: "live"; records: DashboardRsvpRecord[] }
  | {
      ok: false;
      source: "demo";
      reason: "missing_env" | "table_missing" | "columns_missing" | "query_failed";
      message: string;
    };

const STATUS_LABELS: Record<RsvpStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
};

export function formatRsvpStatusLabel(status: RsvpStatus): string {
  return STATUS_LABELS[status];
}

export function isRsvpStatus(value: string): value is RsvpStatus {
  return (RSVP_STATUSES as readonly string[]).includes(value);
}

export function formatRsvpDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
