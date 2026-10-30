import { assertPermission } from "@/lib/auth/rbac";
import "server-only";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbOne, dbQuery } from "@/lib/db/query";
import { asIso } from "@/lib/db/values";
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
  start_time: string | Date | null;
  end_time: string | Date | null;
  location: string | null;
  speaker: string | null;
  category: string | null;
  display_order: number;
  published: boolean | number;
  created_at: string | Date;
  updated_at: string | Date;
};

function mapRow(row: ProgrammeRow): ProgrammeItemRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startTime: asIso(row.start_time),
    endTime: asIso(row.end_time),
    location: row.location,
    speaker: row.speaker,
    category: row.category,
    displayOrder: row.display_order,
    published: row.published === true || row.published === 1,
    createdAt: asIso(row.created_at) ?? "",
    updatedAt: asIso(row.updated_at) ?? "",
  };
}

export type FetchProgrammeResult =
  | { ok: true; records: ProgrammeItemRecord[] }
  | { ok: false; message: string };

export async function fetchProgrammeItems(opts?: {
  publishedOnly?: boolean;
}): Promise<FetchProgrammeResult> {
  if (!opts?.publishedOnly) await assertPermission("programme.read");
  const env = getDatabaseEnvPresence();
  if (!env.ready) return { ok: false, message: "Database is not configured." };
  const event = getActiveEventConfig();
  try {
    const rows = await dbQuery<ProgrammeRow>(
      `SELECT id, title, description, start_time, end_time, location, speaker, category, display_order, published, created_at, updated_at
       FROM programme_items
       WHERE event_slug = @slug AND (@publishedOnly = 0 OR published = 1)
       ORDER BY display_order ASC`,
      { slug: event.slug, publishedOnly: Boolean(opts?.publishedOnly) },
    );
    return { ok: true, records: rows.map(mapRow) };
  } catch (error) {
    console.error("[programme] Query failed:", errorMessage(error));
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
  const params = {
    slug: event.slug,
    title: d.title,
    description: d.description?.trim() || null,
    startTime: d.startTime || null,
    endTime: d.endTime || null,
    location: d.location?.trim() || null,
    speaker: d.speaker?.trim() || null,
    category: d.category?.trim() || null,
    displayOrder: d.displayOrder ?? 0,
    published: d.published ?? false,
  };
  try {
    if (id) {
      const updated = await dbExec(
        `UPDATE programme_items
         SET title = @title, description = @description,
             start_time = TRY_CONVERT(datetimeoffset, @startTime),
             end_time = TRY_CONVERT(datetimeoffset, @endTime),
             location = @location, speaker = @speaker, category = @category,
             display_order = @displayOrder, published = @published, updated_at = SYSDATETIMEOFFSET()
         WHERE id = @id`,
        { ...params, id },
      );
      if (updated === 0) return { ok: false, error: "Could not update programme item." };
      return { ok: true, id };
    }
    const created = await dbOne<{ id: string }>(
      `INSERT INTO programme_items (
         event_slug, title, description, start_time, end_time, location, speaker, category, display_order, published
       )
       OUTPUT INSERTED.id
       VALUES (
         @slug, @title, @description, TRY_CONVERT(datetimeoffset, @startTime), TRY_CONVERT(datetimeoffset, @endTime),
         @location, @speaker, @category, @displayOrder, @published
       )`,
      params,
    );
    if (!created) return { ok: false, error: "Could not create programme item." };
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[programme] Save failed:", errorMessage(error));
    return { ok: false, error: "Could not save programme item." };
  }
}

export async function deleteProgrammeItem(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const removed = await dbExec(`DELETE FROM programme_items WHERE id = @id`, { id });
    if (removed === 0) return { ok: false, error: "Could not delete programme item." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete programme item." };
  }
}
