import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  type Permission,
  type PlatformRole,
  isPlatformRole,
  permissionsForRole,
} from "@/lib/auth/permissions";

export type { Permission, PlatformRole };
export {
  PLATFORM_ROLES,
  ROLE_PERMISSIONS,
  formatRoleLabel,
  isPlatformRole,
  permissionsForRole,
} from "@/lib/auth/permissions";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: PlatformRole;
  permissions: readonly Permission[];
};

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

export async function listProfiles(): Promise<
  { id: string; email: string; fullName: string | null; role: PlatformRole; isActive: boolean }[]
> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, is_active")
      .order("email", { ascending: true });
    if (error) return [];
    return (data ?? [])
      .filter((p) => isPlatformRole(p.role))
      .map((p) => ({
        id: p.id as string,
        email: p.email as string,
        fullName: (p.full_name as string | null) ?? null,
        role: p.role as PlatformRole,
        isActive: Boolean(p.is_active),
      }));
  } catch {
    return [];
  }
}

export async function updateProfileRole(
  profileId: string,
  patch: { role?: PlatformRole; isActive?: boolean },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.role !== undefined) payload.role = patch.role;
    if (patch.isActive !== undefined) payload.is_active = patch.isActive;
    const { error } = await supabase.from("profiles").update(payload).eq("id", profileId);
    if (error) return { ok: false, error: "Could not update user role." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update user role." };
  }
}
