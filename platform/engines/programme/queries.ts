import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import {
  programmeItemSchema,
  type ProgrammeItemFormValues,
  type ProgrammeItemRecord,
} from "@/platform/engines/programme/schema";

type ProgrammeRow = {
  id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  speaker: string | null;
  category: string | null;
  display_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ProgrammeRow): ProgrammeItemRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: row.start_time,
    endTime: row.end_time,
    location: row.location,
    speaker: row.speaker,
    category: row.category,
    displayOrder: row.display_order,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type FetchProgrammeResult =
  | { ok: true; records: ProgrammeItemRecord[] }
  | { ok: false; message: string };

export async function fetchProgrammeItems(opts?: {
  publishedOnly?: boolean;
}): Promise<FetchProgrammeResult> {
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ok: false, message: "Database is not configured." };
  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    let query = supabase
      .from("programme_items")
      .select("*")
      .eq("event_slug", event.slug)
      .order("display_order", { ascending: true });
    if (opts?.publishedOnly) query = query.eq("published", true);
    const { data, error } = await query;
    if (error) {
      console.error("[programme] Query failed:", error.message);
      return { ok: false, message: "Unable to load programme." };
    }
    return { ok: true, records: (data ?? []).map((r) => mapRow(r as ProgrammeRow)) };
  } catch {
    return { ok: false, message: "Unable to load programme." };
  }
}

export async function upsertProgrammeItem(
  raw: unknown,
  id?: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = programmeItemSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check programme details." };
  const event = getActiveEventConfig();
  const d = parsed.data as ProgrammeItemFormValues;
  const payload = {
    event_slug: event.slug,
    title: d.title,
    description: d.description?.trim() || null,
    start_time: d.startTime || null,
    end_time: d.endTime || null,
    location: d.location?.trim() || null,
    speaker: d.speaker?.trim() || null,
    category: d.category?.trim() || null,
    display_order: d.displayOrder ?? 0,
    published: d.published ?? false,
  };
  try {
    const supabase = createServiceRoleClient();
    if (id) {
      const { error } = await supabase.from("programme_items").update(payload).eq("id", id);
      if (error) return { ok: false, error: "Could not update programme item." };
      return { ok: true, id };
    }
    const { data, error } = await supabase
      .from("programme_items")
      .insert(payload)
      .select("id")
      .single();
    if (error || !data) return { ok: false, error: "Could not create programme item." };
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Could not save programme item." };
  }
}

export async function deleteProgrammeItem(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("programme_items").delete().eq("id", id);
    if (error) return { ok: false, error: "Could not delete programme item." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete programme item." };
  }
}
