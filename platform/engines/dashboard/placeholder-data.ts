/** Promax Event Platform — committee portal navigation (reusable across events). */

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
};

export const DASHBOARD_NAV: readonly DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Executive",
    description: "Overview and KPIs",
    icon: "◈",
  },
  {
    href: "/dashboard/rsvps",
    label: "RSVPs",
    description: "Interest registrations",
    icon: "✉",
    badge: "Live soon",
  },
  {
    href: "/dashboard/sponsors",
    label: "Sponsors",
    description: "CRM pipeline",
    icon: "★",
  },
  {
    href: "/dashboard/volunteers",
    label: "Volunteers",
    description: "Roster & shifts",
    icon: "◎",
  },
  {
    href: "/dashboard/tasks",
    label: "Tasks",
    description: "Committee board",
    icon: "☑",
  },
  {
    href: "/dashboard/programme",
    label: "Programme",
    description: "Run of show",
    icon: "♪",
  },
  {
    href: "/dashboard/announcements",
    label: "Announcements",
    description: "Public updates",
    icon: "📣",
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    description: "Engagement metrics",
    icon: "◆",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    description: "Org & integrations",
    icon: "⚙",
  },
] as const;

export type StatMetric = {
  label: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
};

export type TableRow = Record<string, string>;

export const EXECUTIVE_STATS: readonly StatMetric[] = [
  { label: "Interest registrations", value: "0", change: "Awaiting migration", trend: "neutral" },
  { label: "Sponsor pipeline", value: "4 tiers", change: "Packages TBC", trend: "neutral" },
  { label: "Volunteers", value: "0", change: "Recruitment opens soon", trend: "neutral" },
  { label: "Open tasks", value: "12", change: "3 high priority", trend: "up" },
];

export const PLACEHOLDER_RSVPS: readonly TableRow[] = [
  {
    name: "—",
    email: "—",
    guests: "—",
    ticket: "—",
    date: "Connect Supabase to view",
  },
];

export const PLACEHOLDER_SPONSORS: readonly TableRow[] = [
  { tier: "Platinum Patron", status: "Available", contact: "—", value: "TBC" },
  { tier: "Gold Circle", status: "Available", contact: "—", value: "TBC" },
  { tier: "Heritage Partner", status: "Available", contact: "—", value: "TBC" },
  { tier: "Community Ally", status: "Available", contact: "—", value: "TBC" },
];

export const PLACEHOLDER_VOLUNTEERS: readonly TableRow[] = [
  { name: "—", role: "Registration desk", shift: "TBC", status: "Open" },
  { name: "—", role: "Ushering", shift: "TBC", status: "Open" },
  { name: "—", role: "Stage support", shift: "TBC", status: "Open" },
];

export const PLACEHOLDER_TASKS: readonly TableRow[] = [
  { task: "Confirm venue contract", owner: "Committee", due: "TBC", status: "In progress" },
  { task: "Finalise sponsor deck", owner: "Partnerships", due: "TBC", status: "To do" },
  { task: "Run Supabase migration", owner: "Tech", due: "Before launch", status: "High" },
  { task: "Approve programme draft", owner: "Programme", due: "TBC", status: "To do" },
];

export const PLACEHOLDER_PROGRAMME: readonly TableRow[] = [
  { time: "14:00", item: "Doors & welcome", lead: "MC", zone: "Main hall" },
  { time: "14:30", item: "Opening ceremony", lead: "Elders", zone: "Main hall" },
  { time: "15:15", item: "Talking drum showcase", lead: "Cultural", zone: "Stage" },
  { time: "16:00", item: "Cuisine service", lead: "Catering", zone: "Dining" },
];

export const PLACEHOLDER_ANNOUNCEMENTS: readonly TableRow[] = [
  { title: "Register Interest now open", status: "Published", channel: "Website", date: "Jul 2026" },
  { title: "Sponsorship packages", status: "Draft", channel: "Email + Web", date: "TBC" },
  { title: "Programme reveal", status: "Planned", channel: "Social", date: "TBC" },
];

export const PLACEHOLDER_ANALYTICS: readonly StatMetric[] = [
  { label: "Site visits (7d)", value: "—", trend: "neutral" },
  { label: "Register clicks", value: "—", trend: "neutral" },
  { label: "Form completions", value: "—", trend: "neutral" },
  { label: "Bounce rate", value: "—", trend: "neutral" },
];
