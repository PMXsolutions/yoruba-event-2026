/** Dashboard RSVP CRM types — server-side only. */

/** Relationship follow-up status — not an approval workflow. */
export const RSVP_STATUSES = ["new", "contacted", "confirmed", "cancelled"] as const;

export type RsvpStatus = (typeof RSVP_STATUSES)[number];

/** Classification tags — a registrant may have several. */
export const RSVP_TAGS = [
  "VIP",
  "Sponsor Lead",
  "Volunteer",
  "Performer",
  "Vendor",
  "Media",
  "Committee",
  "General Attendee",
] as const;

export type RsvpTag = (typeof RSVP_TAGS)[number];

/** Quick-tag actions shown in row menus. */
export const RSVP_QUICK_TAGS: readonly RsvpTag[] = [
  "VIP",
  "Sponsor Lead",
  "Volunteer",
];

/**
 * Future ticketing journey (not implemented in v1).
 * Register Interest → New → Contacted → Ticket Invited → Paid → Confirmed → Checked In → Completed
 */
export const FUTURE_RSVP_JOURNEY = [
  "Register Interest",
  "New",
  "Contacted",
  "Ticket Invited",
  "Paid",
  "Confirmed",
  "Checked In",
  "Completed",
] as const;

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
  committeeNotes: string | null;
  contactedAt: string | null;
  tags: readonly RsvpTag[];
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

export type RsvpKpiMetrics = {
  totalRegistrations: number;
  newToday: number;
  contacted: number;
  confirmed: number;
  expectedGuests: number;
  pendingFollowUp: number;
};

const STATUS_LABELS: Record<RsvpStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export function formatRsvpStatusLabel(status: RsvpStatus): string {
  return STATUS_LABELS[status];
}

export function isRsvpStatus(value: string): value is RsvpStatus {
  return (RSVP_STATUSES as readonly string[]).includes(value);
}

export function isRsvpTag(value: string): value is RsvpTag {
  return (RSVP_TAGS as readonly string[]).includes(value);
}

export function normalizeTags(raw: unknown): RsvpTag[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is RsvpTag => typeof t === "string" && isRsvpTag(t));
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

export function formatRsvpDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function computeRsvpKpis(records: readonly DashboardRsvpRecord[]): RsvpKpiMetrics {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let newToday = 0;
  let contacted = 0;
  let confirmed = 0;
  let expectedGuests = 0;
  let pendingFollowUp = 0;

  for (const r of records) {
    if (new Date(r.createdAt) >= startOfToday && r.status === "new") newToday += 1;
    if (r.status === "contacted") contacted += 1;
    if (r.status === "confirmed") confirmed += 1;
    if (r.status !== "cancelled") expectedGuests += r.numberOfAttendees;
    if (r.status === "new" || r.status === "contacted") pendingFollowUp += 1;
  }

  return {
    totalRegistrations: records.length,
    newToday,
    contacted,
    confirmed,
    expectedGuests,
    pendingFollowUp,
  };
}
