import { assertPermission } from "@/lib/auth/rbac";
import "server-only";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbQuery } from "@/lib/db/query";
import { asIso } from "@/lib/db/values";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import type { StatMetric, ActivityItem, MilestoneItem } from "@/platform/engines/dashboard/nav";

export type ExecutiveDashboardData = {
  stats: StatMetric[];
  activity: ActivityItem[];
  milestones: MilestoneItem[];
  funnel: { label: string; value: number }[];
  trend: { label: string; value: number }[];
  openTasks: { task: string; owner: string; due: string; priority: string; status: string; progress: string }[];
  error?: string;
};

function daysUntil(iso: string): number {
  const target = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

export async function fetchExecutiveDashboard(): Promise<ExecutiveDashboardData> {
  await assertPermission("analytics.read");
  const event = getActiveEventConfig();
  const empty: ExecutiveDashboardData = {
    stats: [
      { label: "Total RSVPs", value: "0", trend: "neutral", icon: "✉" },
      { label: "Confirmed", value: "0", trend: "neutral", icon: "◎" },
      { label: "New", value: "0", trend: "neutral", icon: "◆" },
      { label: "Cancelled", value: "0", trend: "neutral", icon: "✕" },
      { label: "Sponsors", value: "0", trend: "neutral", icon: "★" },
      { label: "Volunteers", value: "0", trend: "neutral", icon: "◎" },
      { label: "Open tasks", value: "0", trend: "neutral", icon: "☑" },
      { label: "Days to event", value: String(daysUntil(event.eventIso)), trend: "neutral", icon: "◷" },
    ],
    activity: [],
    milestones: [
      { title: event.name, date: event.heroDateDisplay, status: "upcoming" },
    ],
    funnel: [
      { label: "New", value: 0 },
      { label: "Contacted", value: 0 },
      { label: "Confirmed", value: 0 },
      { label: "Cancelled", value: 0 },
    ],
    trend: [],
    openTasks: [],
  };

  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return { ...empty, error: "Database is not configured." };
  }

  try {
    const slug = event.slug;
    const load = <T extends object>(text: string) =>
      dbQuery<T>(text, { slug }).then(
        (data) => ({ data, error: null as { message: string } | null }),
        (error: unknown) => ({ data: [] as T[], error: { message: errorMessage(error) } }),
      );

    const [rsvpsRes, sponsorsRes, volunteersRes, tasksRes, programmeRes, announcementsRes, activityRes] =
      await Promise.all([
        load<{ id: string; status: string; number_of_attendees: number; created_at: string | Date; full_name: string }>(
          `SELECT id, status, number_of_attendees, created_at, full_name FROM rsvps WHERE event_slug = @slug`,
        ),
        load<{ id: string; status: string; company_name: string; created_at: string | Date }>(
          `SELECT id, status, company_name, created_at FROM sponsors WHERE event_slug = @slug`,
        ),
        load<{ id: string; status: string; full_name: string; created_at: string | Date }>(
          `SELECT id, status, full_name, created_at FROM volunteers WHERE event_slug = @slug`,
        ),
        load<{ id: string; title: string; status: string; priority: string; due_date: string | Date | null; assigned_to: string | null }>(
          `SELECT id, title, status, priority, due_date, assigned_to FROM tasks WHERE event_slug = @slug`,
        ),
        load<{ id: string; title: string; start_time: string | Date | null; published: boolean | number }>(
          `SELECT TOP 5 id, title, start_time, published FROM programme_items WHERE event_slug = @slug AND published = 1 ORDER BY display_order ASC`,
        ),
        load<{ id: string; title: string; is_published: boolean | number; created_at: string | Date }>(
          `SELECT TOP 5 id, title, is_published, created_at FROM announcements WHERE event_slug = @slug AND archived_at IS NULL ORDER BY created_at DESC`,
        ),
        load<{ id: string; action: string; entity_type: string | null; created_at: string | Date; metadata: string | null }>(
          `SELECT TOP 8 id, action, entity_type, created_at, metadata FROM activity_logs WHERE event_slug = @slug ORDER BY created_at DESC`,
        ),
      ]);

    const rsvps = rsvpsRes.error ? [] : (rsvpsRes.data ?? []);
    const sponsors = sponsorsRes.error ? [] : (sponsorsRes.data ?? []);
    const volunteers = volunteersRes.error ? [] : (volunteersRes.data ?? []);
    const tasks = tasksRes.error ? [] : (tasksRes.data ?? []);

    const queryErrors = [
      rsvpsRes.error,
      sponsorsRes.error,
      volunteersRes.error,
      tasksRes.error,
      programmeRes.error,
      announcementsRes.error,
      activityRes.error,
    ].filter(Boolean);

    if (queryErrors.length > 0) {
      console.error(
        "[dashboard-overview] One or more queries failed:",
        queryErrors.map((e) => e?.message).join(" | "),
      );
    }

    const byStatus = (s: string) => rsvps.filter((r) => r.status === s).length;
    const newCount = byStatus("new");
    const confirmed = byStatus("confirmed");
    const cancelled = byStatus("cancelled");
    const contacted = byStatus("contacted");
    const openTasks = tasks.filter((t) => t.status !== "completed");

    // Trend: RSVPs per day last 14 days
    const trendMap = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trendMap.set(key, 0);
    }
    for (const r of rsvps) {
      const key = (asIso(r.created_at) ?? "").slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }
    const trend = Array.from(trendMap.entries()).map(([label, value]) => ({
      label: label.slice(5),
      value,
    }));

    const activity: ActivityItem[] = (activityRes.data ?? []).map((a) => ({
      id: a.id,
      title: String(a.action),
      detail: a.entity_type ? String(a.entity_type) : "System",
      time: formatRelative(asIso(a.created_at) ?? ""),
      type: mapActivityType(String(a.action)),
    }));

    const upcomingProgramme: MilestoneItem[] = (programmeRes.data ?? []).map((p) => ({
      title: p.title as string,
      date: p.start_time
        ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(
            new Date(p.start_time as string),
          )
        : "TBC",
      status: "upcoming" as const,
    }));

    const recentAnnouncements: MilestoneItem[] = (announcementsRes.data ?? [])
      .filter((a) => a.is_published === true || a.is_published === 1)
      .slice(0, 3)
      .map((a) => ({
        title: a.title as string,
        date: formatRelative(asIso(a.created_at) ?? ""),
        status: "done" as const,
      }));

    const milestones: MilestoneItem[] = [
      ...upcomingProgramme.slice(0, 2),
      ...recentAnnouncements.slice(0, 2),
      { title: event.name, date: event.heroDateDisplay, status: "upcoming" as const },
    ].slice(0, 5);

    return {
      stats: [
        { label: "Total RSVPs", value: String(rsvps.length), trend: "neutral", icon: "✉" },
        { label: "Confirmed", value: String(confirmed), trend: "up", icon: "◎" },
        { label: "New", value: String(newCount), trend: "neutral", icon: "◆" },
        { label: "Cancelled", value: String(cancelled), trend: "neutral", icon: "✕" },
        { label: "Sponsors", value: String(sponsors.length), trend: "neutral", icon: "★" },
        { label: "Volunteers", value: String(volunteers.length), trend: "neutral", icon: "◎" },
        { label: "Open tasks", value: String(openTasks.length), trend: openTasks.length > 0 ? "up" : "neutral", icon: "☑" },
        {
          label: "Days to event",
          value: String(daysUntil(event.eventIso)),
          change: event.heroDateDisplay,
          trend: "neutral",
          icon: "◷",
        },
      ],
      activity,
      milestones,
      funnel: [
        { label: "New", value: newCount },
        { label: "Contacted", value: contacted },
        { label: "Confirmed", value: confirmed },
        { label: "Cancelled", value: cancelled },
      ],
      trend,
      openTasks: openTasks.slice(0, 8).map((t) => ({
        task: t.title as string,
        owner: t.assigned_to ? "Assigned" : "Unassigned",
        due: t.due_date
          ? new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(
              new Date(t.due_date as string),
            )
          : "—",
        priority: String(t.priority),
        status: String(t.status).replace("_", " "),
        progress: t.status === "in_progress" ? "50" : t.status === "blocked" ? "20" : "0",
      })),
      error:
        queryErrors.length > 0
          ? "Some live metrics could not be loaded. Confirm migrations are applied."
          : undefined,
    };
  } catch (e) {
    console.error("[dashboard-overview] Failed:", e);
    return { ...empty, error: "Unable to load live dashboard metrics." };
  }
}

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `${hours}h ago`;
    return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function mapActivityType(action: string): ActivityItem["type"] {
  if (action.startsWith("rsvp")) return "rsvp";
  if (action.startsWith("sponsor")) return "sponsor";
  if (action.startsWith("volunteer")) return "volunteer";
  if (action.startsWith("task")) return "task";
  if (action.startsWith("programme")) return "programme";
  if (action.startsWith("announcement")) return "announcement";
  return "task";
}

export type AnalyticsData = {
  rsvpsOverTime: { label: string; value: number }[];
  statusBreakdown: { label: string; value: number }[];
  ticketTypes: { label: string; value: number }[];
  sponsorPackages: { label: string; value: number }[];
  attendeeTotal: number;
  volunteerCount: number;
  sponsorCount: number;
  rsvpCount: number;
  empty: boolean;
  error?: string;
};

export async function fetchAnalytics(): Promise<AnalyticsData> {
  await assertPermission("analytics.read");
  const empty: AnalyticsData = {
    rsvpsOverTime: [],
    statusBreakdown: [],
    ticketTypes: [],
    sponsorPackages: [],
    attendeeTotal: 0,
    volunteerCount: 0,
    sponsorCount: 0,
    rsvpCount: 0,
    empty: true,
  };

  const env = getDatabaseEnvPresence();
  if (!env.ready) return { ...empty, error: "Database is not configured." };

  const event = getActiveEventConfig();
  try {
    const [rsvpsRes, sponsorsRes, volunteersRes] = await Promise.all([
      dbQuery<{ status: string; ticket_type: string | null; number_of_attendees: number; created_at: string | Date }>(
        `SELECT status, ticket_type, number_of_attendees, created_at FROM rsvps WHERE event_slug = @slug`,
        { slug: event.slug },
      ).then((data) => ({ data })),
      dbQuery<{ package: string; status: string }>(
        `SELECT package, status FROM sponsors WHERE event_slug = @slug`,
        { slug: event.slug },
      ).then((data) => ({ data })),
      dbQuery<{ id: string }>(
        `SELECT id FROM volunteers WHERE event_slug = @slug`,
        { slug: event.slug },
      ).then((data) => ({ data })),
    ]);

    const rsvps = rsvpsRes.data ?? [];
    const sponsors = sponsorsRes.data ?? [];
    const volunteers = volunteersRes.data ?? [];

    if (rsvps.length === 0 && sponsors.length === 0 && volunteers.length === 0) {
      return empty;
    }

    const trendMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      trendMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const r of rsvps) {
      const key = (asIso(r.created_at) ?? "").slice(0, 10);
      if (trendMap.has(key)) trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }

    const statusMap = new Map<string, number>();
    const ticketMap = new Map<string, number>();
    let attendees = 0;
    for (const r of rsvps) {
      statusMap.set(String(r.status), (statusMap.get(String(r.status)) ?? 0) + 1);
      const tt = (r.ticket_type as string) || "Unspecified";
      ticketMap.set(tt, (ticketMap.get(tt) ?? 0) + 1);
      if (r.status !== "cancelled") attendees += Number(r.number_of_attendees) || 0;
    }

    const packageMap = new Map<string, number>();
    for (const s of sponsors) {
      const pkg = (s.package as string) || "Unspecified";
      packageMap.set(pkg, (packageMap.get(pkg) ?? 0) + 1);
    }

    return {
      rsvpsOverTime: Array.from(trendMap.entries()).map(([label, value]) => ({
        label: label.slice(5),
        value,
      })),
      statusBreakdown: Array.from(statusMap.entries()).map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
      })),
      ticketTypes: Array.from(ticketMap.entries()).map(([label, value]) => ({ label, value })),
      sponsorPackages: Array.from(packageMap.entries()).map(([label, value]) => ({ label, value })),
      attendeeTotal: attendees,
      volunteerCount: volunteers.length,
      sponsorCount: sponsors.length,
      rsvpCount: rsvps.length,
      empty: false,
    };
  } catch (e) {
    console.error("[analytics] Failed:", e);
    return { ...empty, error: "Unable to load analytics." };
  }
}
