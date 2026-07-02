"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  updateDashboardRsvpInternalNote,
  updateDashboardRsvpStatus,
} from "@/platform/engines/dashboard/rsvp/queries";
import { RSVP_STATUSES } from "@/platform/engines/dashboard/rsvp/types";

const statusSchema = z.enum(RSVP_STATUSES);
const noteSchema = z.string().max(4000);
const idSchema = z.string().uuid();

/**
 * Committee dashboard RSVP actions — server-only via service role.
 * TODO(platform-auth): Protect with Supabase Auth + RBAC before public launch.
 */

export async function updateRsvpStatusAction(
  id: string,
  status: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid RSVP id." };

  const parsedStatus = statusSchema.safeParse(status);
  if (!parsedStatus.success) return { ok: false, error: "Invalid status." };

  const result = await updateDashboardRsvpStatus(parsedId.data, parsedStatus.data);
  if (result.ok) {
    revalidatePath("/dashboard/rsvps");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function updateRsvpInternalNoteAction(
  id: string,
  internalNotes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: "Invalid RSVP id." };

  const parsedNote = noteSchema.safeParse(internalNotes);
  if (!parsedNote.success) return { ok: false, error: "Note is too long." };

  const result = await updateDashboardRsvpInternalNote(parsedId.data, parsedNote.data);
  if (result.ok) {
    revalidatePath("/dashboard/rsvps");
  }
  return result;
}
