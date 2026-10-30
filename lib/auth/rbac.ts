import "server-only";

import { readRequestSessionUserId } from "@/lib/auth/session";
import { dbOne } from "@/lib/db/query";

export const PLATFORM_ROLES = ["SUPER_ADMIN", "ADMIN", "COMMITTEE", "VOLUNTEER"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export type Permission =
  | "rsvp.read"
  | "rsvp.write"
  | "rsvp.export"
  | "sponsor.read"
  | "sponsor.write"
  | "sponsor.export"
  | "volunteer.read"
  | "volunteer.write"
  | "task.read"
  | "task.write"
  | "programme.read"
  | "programme.write"
  | "announcement.read"
  | "announcement.write"
  | "analytics.read"
  | "settings.read"
  | "user.manage";

const ROLE_PERMISSIONS: Record<PlatformRole, readonly Permission[]> = {
  SUPER_ADMIN: [
    "rsvp.read",
    "rsvp.write",
    "rsvp.export",
    "sponsor.read",
    "sponsor.write",
    "sponsor.export",
    "volunteer.read",
    "volunteer.write",
    "task.read",
    "task.write",
    "programme.read",
    "programme.write",
    "announcement.read",
    "announcement.write",
    "analytics.read",
    "settings.read",
    "user.manage",
  ],
  ADMIN: [
    "rsvp.read",
    "rsvp.write",
    "rsvp.export",
    "sponsor.read",
    "sponsor.write",
    "sponsor.export",
    "volunteer.read",
    "volunteer.write",
    "task.read",
    "task.write",
    "programme.read",
    "programme.write",
    "announcement.read",
    "announcement.write",
    "analytics.read",
    "settings.read",
  ],
  COMMITTEE: [
    "rsvp.read",
    "rsvp.write",
    "rsvp.export",
    "sponsor.read",
    "sponsor.write",
    "volunteer.read",
    "volunteer.write",
    "task.read",
    "task.write",
    "programme.read",
    "programme.write",
    "announcement.read",
    "announcement.write",
    "analytics.read",
    "settings.read",
  ],
  VOLUNTEER: [
    "rsvp.read",
    "volunteer.read",
    "task.read",
    "programme.read",
    "announcement.read",
    "analytics.read",
  ],
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: PlatformRole;
  permissions: readonly Permission[];
};

function isPlatformRole(value: string): value is PlatformRole {
  return (PLATFORM_ROLES as readonly string[]).includes(value);
}

export function permissionsForRole(role: PlatformRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(user: AuthUser, permission: Permission): boolean {
  if (user.role === "SUPER_ADMIN") return true;
  return user.permissions.includes(permission);
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const userId = await readRequestSessionUserId();
    if (!userId) return null;

    const profile = await dbOne<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      is_active: boolean | number;
    }>(`SELECT id, email, full_name, role, is_active FROM profiles WHERE id = @id`, { id: userId });

    const active = profile?.is_active === true || profile?.is_active === 1;
    if (!profile || !active || !profile.email) return null;
    if (!isPlatformRole(profile.role)) return null;

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      permissions: permissionsForRole(profile.role),
    };
  } catch {
    return null;
  }
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; error: "UNAUTHORIZED" | "FORBIDDEN"; message: string };

export async function requireAuth(permission?: Permission): Promise<AuthResult> {
  const user = await getAuthUser();
  if (!user) {
    return {
      ok: false,
      error: "UNAUTHORIZED",
      message: "Please sign in to continue.",
    };
  }
  if (permission && !hasPermission(user, permission)) {
    return {
      ok: false,
      error: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    };
  }
  return { ok: true, user };
}

/** Guard service-role dashboard reads as well as their route entry points. */
export async function assertPermission(permission: Permission): Promise<void> {
  const auth = await requireAuth(permission);
  if (!auth.ok) throw new Error(auth.error);
}
