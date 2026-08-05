import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
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

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return { ...empty, error: "Database is not configured." };
  }

  try {
    const supabase = createServiceRoleClient();
    const slug = event.slug;

    const [rsvpsRes, sponsorsRes, volunteersRes, tasksRes, programmeRes, announcementsRes, activityRes] =
      await Promise.all([
        supabase.from("rsvps").select("id, status, number_of_attendees, created_at, full_name").eq("event_slug", slug),
        supabase.from("sponsors").select("id, status, company_name, created_at").eq("event_slug", slug),
        supabase.from("volunteers").select("id, status, full_name, created_at").eq("event_slug", slug),
        supabase.from("tasks").select("id, title, status, priority, due_date, assigned_to").eq("event_slug", slug),
        supabase
          .from("programme_items")
          .select("id, title, start_time, published")
          .eq("event_slug", slug)
          .eq("published", true)
          .order("display_order", { ascending: true })
          .limit(5),
        supabase
          .from("announcements")
          .select("id, title, is_published, created_at")
          .eq("event_slug", slug)
          .is("archived_at", null)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("activity_logs")
          .select("id, action, entity_type, created_at, metadata")
          .eq("event_slug", slug)
          .order("created_at", { ascending: false })
          .limit(8),
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
      const key = String(r.created_at).slice(0, 10);
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
      time: formatRelative(a.created_at),
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
      .filter((a) => a.is_published)
      .slice(0, 3)
      .map((a) => ({
        title: a.title as string,
        date: formatRelative(a.created_at as string),
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

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ...empty, error: "Database is not configured." };

  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    const [rsvpsRes, sponsorsRes, volunteersRes] = await Promise.all([
      supabase
        .from("rsvps")
        .select("status, ticket_type, number_of_attendees, created_at")
        .eq("event_slug", event.slug),
      supabase.from("sponsors").select("package, status").eq("event_slug", event.slug),
      supabase.from("volunteers").select("id").eq("event_slug", event.slug),
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
      const key = String(r.created_at).slice(0, 10);
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
