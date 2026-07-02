import type { DashboardRsvpRecord } from "@/platform/engines/dashboard/rsvp/types";
import { PLACEHOLDER_RSVPS } from "@/platform/engines/dashboard/placeholder-data";

const STATUS_MAP: Record<string, DashboardRsvpRecord["status"]> = {
  New: "new",
  Pending: "new",
  Contacted: "contacted",
  Confirmed: "confirmed",
};

/** Demo fallback records when Supabase is unavailable. */
export function demoDashboardRsvps(): DashboardRsvpRecord[] {
  return PLACEHOLDER_RSVPS.map((row, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    fullName: row.name,
    email: row.email,
    phone: null,
    numberOfAttendees: Number.parseInt(row.guests, 10) || 1,
    ticketType: row.ticket,
    notes: null,
    createdAt: new Date(Date.UTC(2026, 6, 12 - index)).toISOString(),
    status: STATUS_MAP[row.status] ?? "new",
    internalNotes: null,
    contactedAt: row.status === "Confirmed" ? new Date(Date.UTC(2026, 6, 10)).toISOString() : null,
  }));
}
