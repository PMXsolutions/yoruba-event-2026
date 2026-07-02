import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Yoruba Day Canberra 2026",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
