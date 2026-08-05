/** Shared dashboard navigation — not demo operational data. */

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
};

export const DASHBOARD_NAV: readonly DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", description: "Executive command centre", icon: "◈" },
  { href: "/dashboard/rsvps", label: "RSVPs", description: "Interest registrations", icon: "✉" },
  { href: "/dashboard/seating", label: "Seating", description: "Tables, zones & QR", icon: "▦" },
  { href: "/dashboard/check-in", label: "Check-in", description: "Door & steward ops", icon: "✓" },
  { href: "/dashboard/sponsors", label: "Sponsors", description: "Partnership CRM", icon: "★" },
  { href: "/dashboard/volunteers", label: "Volunteers", description: "Roster & shifts", icon: "◎" },
  { href: "/dashboard/tasks", label: "Tasks", description: "Committee board", icon: "☑" },
  { href: "/dashboard/programme", label: "Programme", description: "Run of show", icon: "♪" },
  { href: "/dashboard/announcements", label: "Announcements", description: "Comms hub", icon: "📣" },
  { href: "/dashboard/analytics", label: "Analytics", description: "Engagement metrics", icon: "◆" },
  { href: "/dashboard/settings", label: "Settings", description: "Integrations", icon: "⚙" },
] as const;

export type StatMetric = {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "rsvp" | "sponsor" | "volunteer" | "programme" | "announcement" | "task";
};

export type MilestoneItem = {
  title: string;
  date: string;
  status: "done" | "upcoming" | "at-risk";
};
