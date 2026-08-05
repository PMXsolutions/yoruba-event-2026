import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getAuthUser } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "Dashboard | Yoruba Day Canberra 2026",
  robots: { index: false, follow: false },
};

export default async function DashboardRootLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  const admin = user
    ? { fullName: user.fullName, email: user.email, role: user.role }
    : null;

  return <DashboardLayout admin={admin}>{children}</DashboardLayout>;
}
