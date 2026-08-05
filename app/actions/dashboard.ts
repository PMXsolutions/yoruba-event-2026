"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/rbac";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/activity/log";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getFeatureFlags } from "@/lib/feature-flags";
import {
  submitSponsorEnquiry,
  updateSponsorNotes,
  updateSponsorStatus,
} from "@/platform/engines/sponsors/queries";
import { SPONSOR_STATUSES } from "@/platform/engines/sponsors/schema";
import {
  submitVolunteerRegistration,
  updateVolunteerAssignment,
  updateVolunteerStatus,
} from "@/platform/engines/volunteers/queries";
import { VOLUNTEER_STATUSES } from "@/platform/engines/volunteers/schema";
import { createTask, updateTask } from "@/platform/engines/tasks/queries";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/platform/engines/tasks/schema";
import {
  archiveAnnouncement,
  setAnnouncementPublished,
  upsertAnnouncement,
} from "@/platform/engines/announcements/queries";
import {
  deleteProgrammeItem,
  upsertProgrammeItem,
} from "@/platform/engines/programme/queries";

const idSchema = z.string().uuid();

export async function submitSponsorAction(raw: unknown) {
  if (!getFeatureFlags().SPONSOR_ENQUIRY_OPEN) {
    return {
      ok: false as const,
      error: "Sponsor enquiries are temporarily closed. Please contact the committee directly.",
    };
  }
  const hdrs = await headers();
  const rate = checkRateLimit(clientKeyFromHeaders(hdrs, "sponsor"), 5, 60_000);
  if (!rate.allowed) {
    return { ok: false as const, error: "Too many attempts. Please wait and try again." };
  }
  const result = await submitSponsorEnquiry(raw);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({ eventSlug: event.slug, action: "sponsor.created", entityType: "sponsor" });
  }
  return result;
}

export async function updateSponsorStatusAction(id: string, status: string) {
  const auth = await requireAuth("sponsor.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  if (!(SPONSOR_STATUSES as readonly string[]).includes(status)) {
    return { ok: false as const, error: "Invalid status." };
  }
  const result = await updateSponsorStatus(id, status as (typeof SPONSOR_STATUSES)[number]);
  if (result.ok) {
    revalidatePath("/dashboard/sponsors");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function updateSponsorNotesAction(id: string, notes: string) {
  const auth = await requireAuth("sponsor.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const result = await updateSponsorNotes(id, notes);
  if (result.ok) revalidatePath("/dashboard/sponsors");
  return result;
}

export async function submitVolunteerAction(raw: unknown) {
  if (!getFeatureFlags().VOLUNTEER_INTEREST_OPEN) {
    return {
      ok: false as const,
      error: "Volunteer interest is temporarily closed. Please contact the committee directly.",
    };
  }
  const hdrs = await headers();
  const rate = checkRateLimit(clientKeyFromHeaders(hdrs, "volunteer"), 5, 60_000);
  if (!rate.allowed) {
    return { ok: false as const, error: "Too many attempts. Please wait and try again." };
  }
  const result = await submitVolunteerRegistration(raw);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "volunteer.created",
      entityType: "volunteer",
    });
  }
  return result;
}

export async function updateVolunteerStatusAction(id: string, status: string) {
  const auth = await requireAuth("volunteer.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  if (!(VOLUNTEER_STATUSES as readonly string[]).includes(status)) {
    return { ok: false as const, error: "Invalid status." };
  }
  const result = await updateVolunteerStatus(id, status as (typeof VOLUNTEER_STATUSES)[number]);
  if (result.ok) {
    revalidatePath("/dashboard/volunteers");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function updateVolunteerProfileAction(
  id: string,
  assignedRole: string,
  committeeNotes: string,
) {
  const auth = await requireAuth("volunteer.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const result = await updateVolunteerAssignment(id, assignedRole, committeeNotes);
  if (result.ok) revalidatePath("/dashboard/volunteers");
  return result;
}

export async function createTaskAction(raw: unknown) {
  const auth = await requireAuth("task.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  const result = await createTask(raw, auth.user.id);
  if (result.ok) {
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function updateTaskAction(id: string, raw: unknown) {
  const auth = await requireAuth("task.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };

  const patch: Record<string, unknown> = {};
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (typeof obj.title === "string") patch.title = obj.title;
    if (typeof obj.description === "string") patch.description = obj.description;
    if (typeof obj.status === "string" && (TASK_STATUSES as readonly string[]).includes(obj.status)) {
      patch.status = obj.status;
    }
    if (
      typeof obj.priority === "string" &&
      (TASK_PRIORITIES as readonly string[]).includes(obj.priority)
    ) {
      patch.priority = obj.priority;
    }
    if (typeof obj.dueDate === "string") patch.dueDate = obj.dueDate;
    if (typeof obj.assignedTo === "string") patch.assignedTo = obj.assignedTo;
  }

  const result = await updateTask(id, patch);
  if (result.ok) {
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function saveProgrammeItemAction(raw: unknown, id?: string) {
  const auth = await requireAuth("programme.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (id && !idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const result = await upsertProgrammeItem(raw, id);
  if (result.ok) {
    revalidatePath("/dashboard/programme");
    revalidatePath("/");
  }
  return result;
}

export async function deleteProgrammeItemAction(id: string) {
  const auth = await requireAuth("programme.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const result = await deleteProgrammeItem(id);
  if (result.ok) revalidatePath("/dashboard/programme");
  return result;
}

export async function saveAnnouncementAction(raw: unknown, id?: string) {
  const auth = await requireAuth("announcement.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (id && !idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const result = await upsertAnnouncement(raw, auth.user.id, id);
  if (result.ok) {
    revalidatePath("/dashboard/announcements");
    revalidatePath("/");
  }
  return result;
}

export async function archiveAnnouncementAction(id: string) {
  const auth = await requireAuth("announcement.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const result = await archiveAnnouncement(id);
  if (result.ok) revalidatePath("/dashboard/announcements");
  return result;
}

export async function publishAnnouncementAction(id: string, published: boolean) {
  const auth = await requireAuth("announcement.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const result = await setAnnouncementPublished(id, published);
  if (result.ok) {
    revalidatePath("/dashboard/announcements");
    revalidatePath("/");
  }
  return result;
}

export async function signOutAction() {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}
