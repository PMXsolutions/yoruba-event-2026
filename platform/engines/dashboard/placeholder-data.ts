/** Rich placeholder & demo data for committee portal presentation. */

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

export const EXECUTIVE_STATS: readonly StatMetric[] = [
  { label: "Total RSVPs", value: "0", change: "+0 this week", trend: "neutral", icon: "✉" },
  { label: "Expected attendance", value: "0", change: "From guest counts", trend: "neutral", icon: "◎" },
  { label: "Sponsor pipeline", value: "4", change: "Tiers available", trend: "neutral", icon: "★" },
  { label: "Volunteers", value: "0", change: "Recruitment soon", trend: "neutral", icon: "◆" },
  { label: "Open tasks", value: "12", change: "3 high priority", trend: "up", icon: "☑" },
  { label: "Days to event", value: "143", change: "November 2026", trend: "neutral", icon: "◷" },
];

export const RECENT_ACTIVITY: readonly ActivityItem[] = [
  { id: "1", type: "rsvp", title: "New RSVP received", detail: "Awaiting live Supabase connection", time: "Demo", },
  { id: "2", type: "sponsor", title: "Sponsor prospect added", detail: "Heritage Partner tier — enquiry pending", time: "2h ago" },
  { id: "3", type: "volunteer", title: "Volunteer role opened", detail: "Registration desk shift published", time: "5h ago" },
  { id: "4", type: "programme", title: "Programme item updated", detail: "Talking drum showcase — 15:15 slot", time: "1d ago" },
  { id: "5", type: "announcement", title: "Announcement drafted", detail: "Sponsorship packages — email + web", time: "2d ago" },
];

export const UPCOMING_MILESTONES: readonly MilestoneItem[] = [
  { title: "Public site launch", date: "Jul 2026", status: "done" },
  { title: "Sponsor deck finalised", date: "TBC", status: "upcoming" },
  { title: "Programme reveal", date: "TBC", status: "upcoming" },
  { title: "Ticket sales open", date: "TBC", status: "at-risk" },
];

export type TableRow = Record<string, string>;

export const PLACEHOLDER_RSVPS: readonly TableRow[] = [
  { name: "Adewale Ogundimu", email: "adewale.o@example.com", guests: "2", ticket: "General admission", date: "12 Jul 2026", status: "Confirmed" },
  { name: "Folake Adeyemi", email: "folake.adeyemi@example.com", guests: "4", ticket: "Family bundle", date: "11 Jul 2026", status: "Confirmed" },
  { name: "Chidi Okonkwo", email: "chidi.ok@example.com", guests: "1", ticket: "VIP experience", date: "10 Jul 2026", status: "Pending" },
  { name: "Sarah Mitchell", email: "s.mitchell@example.com", guests: "2", ticket: "General admission", date: "9 Jul 2026", status: "Confirmed" },
];

export const PLACEHOLDER_SPONSORS: readonly TableRow[] = [
  { name: "Canberra Community Bank", contact: "Partnerships team", tier: "Platinum Patron", status: "Prospect", followUp: "15 Jul", value: "TBC" },
  { name: "Heritage Foods Co.", contact: "Marketing lead", tier: "Gold Circle", status: "In discussion", followUp: "18 Jul", value: "TBC" },
  { name: "Ngunnawal Arts Collective", contact: "Director", tier: "Heritage Partner", status: "Prospect", followUp: "22 Jul", value: "TBC" },
  { name: "Local Business Alliance", contact: "Events coordinator", tier: "Community Ally", status: "Available", followUp: "—", value: "TBC" },
];

export const PLACEHOLDER_VOLUNTEERS: readonly TableRow[] = [
  { name: "Tunde Bakare", role: "Registration desk", availability: "Full day", status: "Confirmed", area: "Foyer" },
  { name: "Amara Nwosu", role: "Ushering", availability: "PM shift", status: "Confirmed", area: "Main hall" },
  { name: "— Open role —", role: "Stage support", availability: "TBC", status: "Open", area: "Stage" },
  { name: "— Open role —", role: "Catering liaison", availability: "TBC", status: "Open", area: "Dining" },
];

export const PLACEHOLDER_TASKS: readonly TableRow[] = [
  { task: "Confirm venue contract", owner: "Committee chair", due: "20 Jul", priority: "High", status: "In progress", progress: "65" },
  { task: "Finalise sponsor deck", owner: "Partnerships", due: "25 Jul", priority: "High", status: "To do", progress: "20" },
  { task: "Run Supabase migration", owner: "Tech", due: "Before launch", priority: "Critical", status: "In progress", progress: "80" },
  { task: "Approve programme draft", owner: "Programme", due: "1 Aug", priority: "Medium", status: "To do", progress: "10" },
  { task: "Confirm catering vendor", owner: "Operations", due: "TBC", priority: "Medium", status: "Blocked", progress: "0" },
];

export const PLACEHOLDER_PROGRAMME: readonly TableRow[] = [
  { time: "14:00", segment: "Doors & welcome", owner: "MC team", zone: "Main hall", status: "Draft" },
  { time: "14:30", segment: "Opening ceremony & elder blessings", owner: "Cultural committee", zone: "Main hall", status: "Draft" },
  { time: "15:15", segment: "Talking drum showcase", owner: "Music lead", zone: "Stage", status: "Review" },
  { time: "16:00", segment: "Yoruba cuisine service", owner: "Catering", zone: "Dining", status: "Draft" },
  { time: "17:30", segment: "Eyo procession preview", owner: "Cultural committee", zone: "Courtyard", status: "Planned" },
];

export const PLACEHOLDER_ANNOUNCEMENTS: readonly TableRow[] = [
  { title: "Register Interest now open", channel: "Website", status: "Published", date: "Jul 2026" },
  { title: "Sponsorship packages coming soon", channel: "Email", status: "Draft", date: "TBC" },
  { title: "WhatsApp community update", channel: "WhatsApp", status: "Planned", date: "TBC" },
  { title: "Programme reveal teaser", channel: "Social media", status: "Draft", date: "TBC" },
];

export const PLACEHOLDER_ANALYTICS: readonly StatMetric[] = [
  { label: "Site visits (7d)", value: "1,248", change: "+12% vs prior week", trend: "up" },
  { label: "Register clicks", value: "186", change: "14.9% of visits", trend: "neutral" },
  { label: "Form completions", value: "0", change: "Awaiting live DB", trend: "neutral" },
  { label: "Conversion rate", value: "0%", change: "Placeholder", trend: "neutral" },
];

export const FUNNEL_CHART = [
  { label: "Page views", value: 1248 },
  { label: "RSVP clicks", value: 186 },
  { label: "Form starts", value: 94 },
  { label: "Completed", value: 0 },
] as const;

export const TREND_POINTS = [820, 945, 880, 1102, 1050, 1180, 1248] as const;

export const ATTENDANCE_BREAKDOWN = [
  { label: "General", value: 45, color: "#c9a227" },
  { label: "Family", value: 30, color: "#7a5c1e" },
  { label: "VIP", value: 15, color: "#e4c76a" },
  { label: "Corporate", value: 10, color: "#8a6f38" },
] as const;

export const SPONSOR_PIPELINE_CHART = [
  { label: "Platinum", value: 1 },
  { label: "Gold", value: 1 },
  { label: "Heritage", value: 1 },
  { label: "Community", value: 1 },
] as const;
