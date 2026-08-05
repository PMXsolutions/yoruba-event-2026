"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  toggleDashboardRsvpTag,
  updateDashboardRsvpCommitteeNote,
  updateDashboardRsvpStatus,
} from "@/platform/engines/dashboard/rsvp/queries";
import { RSVP_STATUSES, RSVP_TAGS } from "@/platform/engines/dashboard/rsvp/types";
import { requireAuth } from "@/lib/auth/rbac";
import { logActivity } from "@/lib/activity/log";
import { getActiveEventConfig } from "@/platform/core/config/active-event";

const statusSchema = z.enum(RSVP_STATUSES);
const tagSchema = z.enum(RSVP_TAGS);
const noteSchema = z.string().max(4000);
const idSchema = z.string().uuid();

export async function updateRsvpStatusAction(
  id: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) return { ok: false, error: "Invalid status." };

  const result = await updateDashboardRsvpStatus(parsedId.data, parsedStatus.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "rsvp.status_updated",
      entityType: "rsvp",
      entityId: parsedId.data,
      actorId: auth.user.id,
      metadata: { status: parsedStatus.data },
    });
    revalidatePath("/dashboard/rsvps");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function updateRsvpCommitteeNoteAction(
  id: string,
  committeeNotes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const parsedNote = noteSchema.safeParse(committeeNotes);
  if (!parsedNote.success) return { ok: false, error: "Note is too long." };

  const result = await updateDashboardRsvpCommitteeNote(parsedId.data, parsedNote.data);
  if (result.ok) {
    revalidatePath("/dashboard/rsvps");
  }
  return result;
}

export async function toggleRsvpTagAction(
  id: string,
  tag: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) return { ok: false, error: auth.message };

  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid record." };

  const parsedTag = tagSchema.safeParse(tag);
  if (!parsedTag.success) return { ok: false, error: "Invalid tag." };

  const result = await toggleDashboardRsvpTag(parsedId.data, parsedTag.data);
  if (result.ok) {
    revalidatePath("/dashboard/rsvps");
  }
  return result.ok ? { ok: true } : result;
}
