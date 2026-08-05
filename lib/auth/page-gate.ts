import { redirect } from "next/navigation";
import { requireAuth, type AuthUser, type Permission } from "@/lib/auth/rbac";

/** Gate a dashboard page: auth + optional permission. */
export async function requireDashboardPage(
  permission?: Permission,
  redirectPath = "/dashboard",
): Promise<AuthUser> {
  const auth = await requireAuth(permission);
  if (!auth.ok) {
    if (auth.error === "UNAUTHORIZED") {
      redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    }
    redirect("/dashboard?forbidden=1");
  }
  return auth.user;
}
