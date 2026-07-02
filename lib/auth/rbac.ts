import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RoleSlug } from "@/lib/database/types";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: RoleSlug;
  committeeUserId: string;
  permissions: string[];
};

const ROLE_HIERARCHY: Record<RoleSlug, number> = {
  volunteer: 1,
  committee: 2,
  admin: 3,
  super_admin: 4,
};

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) return null;

    const admin = createServiceRoleClient();
    const { data: committeeUser } = await admin
      .from("committee_users")
      .select("id, full_name, email, is_active, role_id, roles!inner(slug)")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!committeeUser) return null;

    const rolesData = committeeUser.roles as unknown;
    const roleSlug = (
      Array.isArray(rolesData)
        ? (rolesData[0] as { slug: string } | undefined)?.slug
        : (rolesData as { slug: string } | null)?.slug
    ) as RoleSlug | undefined;
    if (!roleSlug) return null;

    const permissions = await getPermissionsForRole(admin, roleSlug);

    return {
      id: user.id,
      email: user.email,
      fullName: committeeUser.full_name,
      role: roleSlug,
      committeeUserId: committeeUser.id,
      permissions,
    };
  } catch {
    return null;
  }
}

async function getPermissionsForRole(
  admin: ReturnType<typeof createServiceRoleClient>,
  roleSlug: RoleSlug,
): Promise<string[]> {
  const { data } = await admin
    .from("role_permissions")
    .select("permissions(slug), roles!inner(slug)")
    .eq("roles.slug", roleSlug);

  if (!data) return [];

  return data
    .map((row) => {
      const perms = row.permissions as unknown;
      if (Array.isArray(perms)) return (perms[0] as { slug: string } | undefined)?.slug;
      return (perms as { slug: string } | null)?.slug;
    })
    .filter((s): s is string => Boolean(s));
}

export function hasPermission(user: AuthUser, permission: string): boolean {
  if (user.role === "super_admin") return true;
  return user.permissions.includes(permission);
}

export function hasMinRole(user: AuthUser, minRole: RoleSlug): boolean {
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
}

export async function requireAuth(permission?: string): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (permission && !hasPermission(user, permission)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
