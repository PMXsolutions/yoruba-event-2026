/** Route metadata for dashboard breadcrumbs and default titles. */

export type DashboardPageMeta = {
  title: string;
  description: string;
  breadcrumbs: readonly { label: string; href?: string }[];
};

export const DASHBOARD_PAGE_META: Record<string, DashboardPageMeta> = {
  "/dashboard": {
    title: "Event Command Centre",
    description:
      "Executive overview of registrations, partnerships, volunteers, and committee progress for Yoruba Day Canberra 2026.",
    breadcrumbs: [{ label: "Overview" }],
  },
  "/dashboard/rsvps": {
    title: "RSVP management",
    description:
      "View, search, and export interest registrations from the Promax RSVP Engine.",
    breadcrumbs: [{ label: "Executive", href: "/dashboard" }, { label: "RSVPs" }],
  },
  "/dashboard/sponsors": {
    title: "Sponsor CRM",
    description: "Track sponsor tiers, enquiries, and partnership pipeline.",
    breadcrumbs: [{ label: "Executive", href: "/dashboard" }, { label: "Sponsors" }],
  },
  "/dashboard/volunteers": {
    title: "Volunteer management",
    description: "Coordinate volunteer roles, shifts, and contact details.",
    breadcrumbs: [{ label: "Executive", href: "/dashboard" }, { label: "Volunteers" }],
  },
  "/dashboard/tasks": {
    title: "Committee tasks",
    description:
      "Planning board for venue, programme, catering, and communications workstreams.",
    breadcrumbs: [{ label: "Executive", href: "/dashboard" }, { label: "Tasks" }],
  },
  "/dashboard/programme": {
    title: "Programme management",
    description: "Build and publish the run of show — times, acts, zones, and MC cues.",
    breadcrumbs: [{ label: "Executive", href: "/dashboard" }, { label: "Programme" }],
  },
  "/dashboard/announcements": {
    title: "Announcements",
    description:
      "Draft and publish updates to the website, email list, and social channels.",
    breadcrumbs: [{ label: "Executive", href: "/dashboard" }, { label: "Announcements" }],
  },
  "/dashboard/analytics": {
    title: "Analytics",
    description:
      "Traffic, conversion, and engagement metrics across the public site and RSVP funnel.",
    breadcrumbs: [{ label: "Executive", href: "/dashboard" }, { label: "Analytics" }],
  },
  "/dashboard/settings": {
    title: "Settings",
    description: "Organisation profile, integrations, and platform configuration.",
    breadcrumbs: [{ label: "Executive", href: "/dashboard" }, { label: "Settings" }],
  },
};

export function getDashboardPageMeta(pathname: string): DashboardPageMeta {
  return (
    DASHBOARD_PAGE_META[pathname] ?? {
      title: "Committee portal",
      description: "Promax Event Platform administration.",
      breadcrumbs: [{ label: "Portal" }],
    }
  );
}
