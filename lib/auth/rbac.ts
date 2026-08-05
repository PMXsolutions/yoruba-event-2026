import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return null;

    const admin = createServiceRoleClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile || !profile.is_active) return null;
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
