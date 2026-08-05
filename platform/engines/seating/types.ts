/** Seating MVP types — Promax Event Platform */

export const SEATING_ZONES = [
  "VIP",
  "Elders",
  "Families",
  "Sponsors",
  "General",
  "Performers",
  "Committee",
  "Accessibility",
] as const;

export type SeatingZone = (typeof SEATING_ZONES)[number];

export type VenueFloorPlan = {
  id: string;
  title: string;
  fileUrl: string | null;
  fileLabel: string | null;
  mimeHint: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
};

export type SeatingTable = {
  id: string;
  name: string;
  zone: string;
  capacity: number;
  sortOrder: number;
  notes: string | null;
  assignedCount: number;
};

export type SeatingAssignment = {
  id: string;
  rsvpId: string;
  tableId: string | null;
  zone: string | null;
  seatLabel: string | null;
  qrToken: string;
  checkedInAt: string | null;
  guestName: string;
  guestEmail: string;
  registrationReference: string | null;
  accessibilityRequirements: string | null;
  ticketType: string | null;
  tableName: string | null;
};

export type SeatLookupResult = {
  guestName: string;
  zone: string | null;
  tableName: string | null;
  seatLabel: string | null;
  ticketType: string | null;
  registrationReference: string | null;
  floorPlanUrl: string | null;
  checkedIn: boolean;
};

export function isSeatingZone(value: string): value is SeatingZone {
  return (SEATING_ZONES as readonly string[]).includes(value);
}
