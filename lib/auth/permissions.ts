/**
 * Permission catalogue — shared by server RBAC and client capability checks.
 */

export type Permission =
  | "rsvp.read"
  | "rsvp.write"
  | "rsvp.export"
  | "sponsor.read"
  | "sponsor.write"
  | "sponsor.export"
  | "volunteer.read"
  | "volunteer.write"
  | "volunteer.export"
  | "task.read"
  | "task.write"
  | "programme.read"
  | "programme.write"
  | "announcement.read"
  | "announcement.write"
  | "analytics.read"
  | "settings.read"
  | "user.manage"
  | "seating.read"
  | "seating.write"
  | "checkin.write";

export const PLATFORM_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "EVENT_DIRECTOR",
  "COMMITTEE",
  "RSVP_MANAGER",
  "SPONSOR_MANAGER",
  "VOLUNTEER_COORDINATOR",
  "PROGRAMME_COORDINATOR",
  "READ_ONLY",
  "VOLUNTEER",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export function isPlatformRole(value: string): value is PlatformRole {
  return (PLATFORM_ROLES as readonly string[]).includes(value);
}

const ALL: readonly Permission[] = [
  "rsvp.read",
  "rsvp.write",
  "rsvp.export",
  "sponsor.read",
  "sponsor.write",
  "sponsor.export",
  "volunteer.read",
  "volunteer.write",
  "volunteer.export",
  "task.read",
  "task.write",
  "programme.read",
  "programme.write",
  "announcement.read",
  "announcement.write",
  "analytics.read",
  "settings.read",
  "user.manage",
  "seating.read",
  "seating.write",
  "checkin.write",
];

const COMMITTEE_BASE: readonly Permission[] = ALL.filter((p) => p !== "user.manage");

export const ROLE_PERMISSIONS: Record<PlatformRole, readonly Permission[]> = {
  SUPER_ADMIN: ALL,
  ADMIN: ALL,
  EVENT_DIRECTOR: COMMITTEE_BASE,
  COMMITTEE: COMMITTEE_BASE,
  RSVP_MANAGER: [
    "rsvp.read",
    "rsvp.write",
    "rsvp.export",
    "seating.read",
    "seating.write",
    "checkin.write",
    "analytics.read",
    "task.read",
  ],
  SPONSOR_MANAGER: [
    "sponsor.read",
    "sponsor.write",
    "sponsor.export",
    "analytics.read",
    "task.read",
  ],
  VOLUNTEER_COORDINATOR: [
    "volunteer.read",
    "volunteer.write",
    "volunteer.export",
    "task.read",
    "task.write",
    "analytics.read",
  ],
  PROGRAMME_COORDINATOR: [
    "programme.read",
    "programme.write",
    "announcement.read",
    "announcement.write",
    "task.read",
    "analytics.read",
  ],
  READ_ONLY: [
    "rsvp.read",
    "sponsor.read",
    "volunteer.read",
    "task.read",
    "programme.read",
    "announcement.read",
    "analytics.read",
    "settings.read",
    "seating.read",
  ],
  VOLUNTEER: [
    "rsvp.read",
    "volunteer.read",
    "task.read",
    "programme.read",
    "announcement.read",
    "analytics.read",
    "seating.read",
    "checkin.write",
  ],
};

export function permissionsForRole(role: PlatformRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function formatRoleLabel(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}
