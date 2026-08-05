import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { getAuthUser } from "@/lib/auth/rbac";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Dashboard | ${SITE.name}`,
  robots: { index: false, follow: false },
};

export default async function DashboardRootLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  return (
    <DashboardLayout
      admin={{ fullName: user.fullName, email: user.email, role: user.role }}
      permissions={user.permissions}
    >
      {children}
    </DashboardLayout>
  );
}
