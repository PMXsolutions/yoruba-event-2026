import { assertPermission } from "@/lib/auth/rbac";
import "server-only";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbOne, dbQuery } from "@/lib/db/query";
import { asIso } from "@/lib/db/values";
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
  is_published: boolean | number;
  published_at: string | Date | null;
  scheduled_for: string | Date | null;
  archived_at: string | Date | null;
  created_by: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function mapRow(row: AnnouncementRow): AnnouncementRecord {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    isPublished: row.is_published === true || row.is_published === 1,
    publishedAt: asIso(row.published_at),
    scheduledFor: asIso(row.scheduled_for),
    archivedAt: asIso(row.archived_at),
    createdBy: row.created_by,
    createdAt: asIso(row.created_at) ?? "",
    updatedAt: asIso(row.updated_at) ?? "",
  };
}

export type FetchAnnouncementsResult =
  | { ok: true; records: AnnouncementRecord[] }
  | { ok: false; message: string };

export async function fetchAnnouncements(opts?: {
  publishedOnly?: boolean;
}): Promise<FetchAnnouncementsResult> {
  if (!opts?.publishedOnly) await assertPermission("announcement.read");
  const env = getDatabaseEnvPresence();
  if (!env.ready) return { ok: false, message: "Database is not configured." };
  const event = getActiveEventConfig();
  try {
    const rows = await dbQuery<AnnouncementRow>(
      `SELECT id, title, body, is_published, published_at, scheduled_for, archived_at, created_by, created_at, updated_at
       FROM announcements
       WHERE event_slug = @slug AND archived_at IS NULL
         AND (@publishedOnly = 0 OR is_published = 1)
       ORDER BY created_at DESC`,
      { slug: event.slug, publishedOnly: Boolean(opts?.publishedOnly) },
    );
    return { ok: true, records: rows.map(mapRow) };
  } catch (error) {
    console.error("[announcements] Query failed:", errorMessage(error));
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
  const now = new Date();

  try {
    if (id) {
      const existing = await dbOne<{ is_published: boolean | number; published_at: string | Date | null }>(
        `SELECT is_published, published_at FROM announcements WHERE id = @id`,
        { id },
      );
      const wasPublished = existing?.is_published === true || existing?.is_published === 1;
      const publishedAt = d.isPublished ? (wasPublished ? existing?.published_at ?? now : now) : null;
      const updated = await dbExec(
        `UPDATE announcements
         SET title = @title, body = @body, is_published = @isPublished,
             published_at = @publishedAt, scheduled_for = @scheduledFor, updated_at = SYSDATETIMEOFFSET()
         WHERE id = @id`,
        {
          id,
          title: d.title,
          body: d.body,
          isPublished: d.isPublished,
          publishedAt,
          scheduledFor: d.scheduledFor || null,
        },
      );
      if (updated === 0) return { ok: false, error: "Could not update announcement." };
      return { ok: true, id };
    }

    const created = await dbOne<{ id: string }>(
      `INSERT INTO announcements (event_slug, title, body, is_published, published_at, scheduled_for, created_by)
       OUTPUT INSERTED.id
       VALUES (@slug, @title, @body, @isPublished, @publishedAt, @scheduledFor, @createdBy)`,
      {
        slug: event.slug,
        title: d.title,
        body: d.body,
        isPublished: d.isPublished,
        publishedAt: d.isPublished ? now : null,
        scheduledFor: d.scheduledFor || null,
        createdBy,
      },
    );
    if (!created) return { ok: false, error: "Could not create announcement." };
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[announcements] Save failed:", errorMessage(error));
    return { ok: false, error: id ? "Could not update announcement." : "Could not save announcement." };
  }
}

export async function archiveAnnouncement(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const updated = await dbExec(
      `UPDATE announcements
       SET archived_at = SYSDATETIMEOFFSET(), is_published = 0, updated_at = SYSDATETIMEOFFSET()
       WHERE id = @id`,
      { id },
    );
    if (updated === 0) return { ok: false, error: "Could not archive announcement." };
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
    const updated = await dbExec(
      `UPDATE announcements
       SET is_published = @published,
           published_at = CASE WHEN @published = 1 THEN SYSDATETIMEOFFSET() ELSE NULL END,
           updated_at = SYSDATETIMEOFFSET()
       WHERE id = @id`,
      { id, published },
    );
    if (updated === 0) return { ok: false, error: "Could not update publish state." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update publish state." };
  }
}
