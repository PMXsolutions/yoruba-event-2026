/** Shared dashboard navigation — event-agnostic platform chrome. */

import type { Permission } from "@/lib/auth/permissions";

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
  permission?: Permission;
};

export const DASHBOARD_NAV: readonly DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", description: "Executive command centre", icon: "◈" },
  {
    href: "/dashboard/rsvps",
    label: "RSVPs",
    description: "Interest registrations",
    icon: "✉",
    permission: "rsvp.read",
  },
  {
    href: "/dashboard/seating",
    label: "Seating",
    description: "Tables, zones & QR",
    icon: "▦",
    permission: "seating.read",
  },
  {
    href: "/dashboard/check-in",
    label: "Check-in",
    description: "Door & steward ops",
    icon: "✓",
    permission: "checkin.write",
  },
  {
    href: "/dashboard/sponsors",
    label: "Sponsors",
    description: "Partnership CRM",
    icon: "★",
    permission: "sponsor.read",
  },
  {
    href: "/dashboard/volunteers",
    label: "Volunteers",
    description: "Roster & interest",
    icon: "◎",
    permission: "volunteer.read",
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
    description: "Committee board",
    icon: "☑",
    permission: "task.read",
  },
  {
    href: "/dashboard/programme",
    label: "Programme",
    description: "Run of show",
    icon: "♪",
    permission: "programme.read",
  },
  {
    href: "/dashboard/announcements",
    label: "Announcements",
    description: "Comms hub",
    icon: "📣",
    permission: "announcement.read",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    description: "Engagement metrics",
    icon: "◆",
    permission: "analytics.read",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    description: "Integrations & roles",
    icon: "⚙",
    permission: "settings.read",
  },
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
