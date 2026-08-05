import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import {
  announcementSchema,
  type AnnouncementFormValues,
  type AnnouncementRecord,
} from "@/platform/engines/announcements/schema";

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  is_published: boolean;
  published_at: string | null;
  scheduled_for: string | null;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: AnnouncementRow): AnnouncementRecord {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    scheduledFor: row.scheduled_for,
    archivedAt: row.archived_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type FetchAnnouncementsResult =
  | { ok: true; records: AnnouncementRecord[] }
  | { ok: false; message: string };

export async function fetchAnnouncements(opts?: {
  publishedOnly?: boolean;
}): Promise<FetchAnnouncementsResult> {
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ok: false, message: "Database is not configured." };
  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    let query = supabase
      .from("announcements")
      .select("*")
      .eq("event_slug", event.slug)
      .is("archived_at", null)
      .order("created_at", { ascending: false });
    if (opts?.publishedOnly) {
      query = query.eq("is_published", true);
    }
    const { data, error } = await query;
    if (error) {
      console.error("[announcements] Query failed:", error.message);
      return { ok: false, message: "Unable to load announcements." };
    }
    return { ok: true, records: (data ?? []).map((r) => mapRow(r as AnnouncementRow)) };
  } catch {
    return { ok: false, message: "Unable to load announcements." };
  }
}

export async function upsertAnnouncement(
  raw: unknown,
  createdBy: string,
  id?: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = announcementSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check announcement details." };
  const event = getActiveEventConfig();
  const d = parsed.data as AnnouncementFormValues;
  const now = new Date().toISOString();

  try {
    const supabase = createServiceRoleClient();

    if (id) {
      const { data: existing } = await supabase
        .from("announcements")
        .select("is_published, published_at")
        .eq("id", id)
        .maybeSingle();

      const wasPublished = Boolean(
        existing && (existing as { is_published?: boolean }).is_published,
      );
      const publishedAt = d.isPublished
        ? wasPublished
          ? ((existing as { published_at?: string | null }).published_at ?? now)
          : now
        : null;

      const { error } = await supabase
        .from("announcements")
        .update({
          title: d.title,
          body: d.body,
          is_published: d.isPublished,
          published_at: publishedAt,
          scheduled_for: d.scheduledFor || null,
        })
        .eq("id", id);
      if (error) return { ok: false, error: "Could not update announcement." };
      return { ok: true, id };
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        event_slug: event.slug,
        title: d.title,
        body: d.body,
        is_published: d.isPublished,
        published_at: d.isPublished ? now : null,
        scheduled_for: d.scheduledFor || null,
        created_by: createdBy,
      })
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Could not create announcement." };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Could not save announcement." };
  }
}

export async function archiveAnnouncement(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("announcements")
      .update({ archived_at: new Date().toISOString(), is_published: false })
      .eq("id", id);
    if (error) return { ok: false, error: "Could not archive announcement." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not archive announcement." };
  }
}

export async function setAnnouncementPublished(
  id: string,
  published: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("announcements")
      .update({
        is_published: published,
        published_at: published ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: "Could not update publish state." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update publish state." };
  }
}
