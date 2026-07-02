import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import type {
  AnnouncementRow,
  FaqRow,
  GalleryRow,
  ProgrammeRow,
  SpeakerRow,
  SponsorRow,
} from "@/lib/database/types";

function getClient() {
  const env = getSupabaseEnvPresence();
  if (!env.allPresent) return null;
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export async function fetchPublishedAnnouncements(): Promise<AnnouncementRow[]> {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("announcements")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(5);
  return (data ?? []) as AnnouncementRow[];
}

export async function fetchProgramme(): Promise<ProgrammeRow[]> {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("programme")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as ProgrammeRow[];
}

export async function fetchSpeakers(): Promise<SpeakerRow[]> {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("speakers")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as SpeakerRow[];
}

export async function fetchGallery(): Promise<GalleryRow[]> {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("gallery")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as GalleryRow[];
}

export async function fetchFaq(): Promise<FaqRow[]> {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("faq")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as FaqRow[];
}

export async function fetchApprovedSponsors(): Promise<SponsorRow[]> {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("sponsors")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });
  return (data ?? []) as SponsorRow[];
}

export async function fetchDashboardStats() {
  const client = getClient();
  if (!client) {
    return {
      totalRsvps: 0,
      todayRsvps: 0,
      totalSponsors: 0,
      pendingSponsors: 0,
      totalVolunteers: 0,
      publishedAnnouncements: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [rsvps, todayRsvps, sponsors, pendingSponsors, volunteers, announcements] =
    await Promise.all([
      client.from("rsvps").select("id", { count: "exact", head: true }),
      client
        .from("rsvps")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayIso),
      client.from("sponsors").select("id", { count: "exact", head: true }),
      client
        .from("sponsors")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      client.from("volunteers").select("id", { count: "exact", head: true }),
      client
        .from("announcements")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
    ]);

  return {
    totalRsvps: rsvps.count ?? 0,
    todayRsvps: todayRsvps.count ?? 0,
    totalSponsors: sponsors.count ?? 0,
    pendingSponsors: pendingSponsors.count ?? 0,
    totalVolunteers: volunteers.count ?? 0,
    publishedAnnouncements: announcements.count ?? 0,
  };
}

export async function fetchRecentActivity(limit = 10) {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchAllRsvps() {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("rsvps")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchAllSponsors() {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("sponsors")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchAllVolunteers() {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("volunteers")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function fetchAllAnnouncements() {
  const client = getClient();
  if (!client) return [];
  const { data } = await client
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}
