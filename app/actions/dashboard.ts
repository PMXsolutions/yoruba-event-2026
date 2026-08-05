"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/rbac";
import { checkRateLimit, clientKeyFromHeaders } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/activity/log";
import { fetchEntityActivity } from "@/lib/activity/queries";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getFeatureFlags } from "@/lib/feature-flags";
import {
  createCommitteeSponsor,
  submitSponsorEnquiry,
  updateSponsorDetails,
  updateSponsorNotes,
  updateSponsorStatus,
} from "@/platform/engines/sponsors/queries";
import { SPONSOR_STATUSES } from "@/platform/engines/sponsors/schema";
import {
  createCommitteeVolunteer,
  submitVolunteerRegistration,
  updateVolunteerAssignment,
  updateVolunteerDetails,
  updateVolunteerStatus,
} from "@/platform/engines/volunteers/queries";
import { VOLUNTEER_STATUSES } from "@/platform/engines/volunteers/schema";
import { createTask, deleteTask, updateTask } from "@/platform/engines/tasks/queries";
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
import { listProfiles, updateProfileRole } from "@/lib/auth/rbac";
import { PLATFORM_ROLES, type PlatformRole } from "@/lib/auth/permissions";

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
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "sponsor.status_updated",
      entityType: "sponsor",
      entityId: id,
      actorId: auth.user.id,
      metadata: { status },
    });
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
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "sponsor.note_updated",
      entityType: "sponsor",
      entityId: id,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/sponsors");
  }
  return result;
}

const sponsorDetailsSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  website: z.string().trim().max(500).optional(),
  package: z.string().min(1),
});

export async function updateSponsorDetailsAction(id: string, raw: unknown) {
  const auth = await requireAuth("sponsor.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const parsed = sponsorDetailsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Please correct the sponsor details." };

  const result = await updateSponsorDetails(id, parsed.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "sponsor.updated",
      entityType: "sponsor",
      entityId: id,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/sponsors");
  }
  return result;
}

const committeeSponsorSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  contactPerson: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  website: z.string().trim().max(500).optional(),
  package: z.string().min(1),
  message: z.string().trim().max(2000).optional(),
  status: z.enum(SPONSOR_STATUSES).optional(),
  committeeNotes: z.string().trim().max(4000).optional(),
});

export async function createCommitteeSponsorAction(raw: unknown) {
  const auth = await requireAuth("sponsor.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  const parsed = committeeSponsorSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Please correct the sponsor details." };

  const result = await createCommitteeSponsor(parsed.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "sponsor.committee_created",
      entityType: "sponsor",
      entityId: result.id,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/sponsors");
    revalidatePath("/dashboard");
  }
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
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "volunteer.status_updated",
      entityType: "volunteer",
      entityId: id,
      actorId: auth.user.id,
      metadata: { status },
    });
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
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "volunteer.profile_updated",
      entityType: "volunteer",
      entityId: id,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/volunteers");
  }
  return result;
}

const volunteerDetailsSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  areaOfInterest: z.string().trim().max(200).optional(),
  availability: z.string().trim().max(500).optional(),
});

export async function updateVolunteerDetailsAction(id: string, raw: unknown) {
  const auth = await requireAuth("volunteer.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };
  const parsed = volunteerDetailsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Please correct the volunteer details." };

  const result = await updateVolunteerDetails(id, parsed.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "volunteer.updated",
      entityType: "volunteer",
      entityId: id,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/volunteers");
  }
  return result;
}

const committeeVolunteerSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(50).optional(),
  areaOfInterest: z.string().trim().max(200).optional(),
  availability: z.string().trim().max(500).optional(),
  assignedRole: z.string().trim().max(200).optional(),
  status: z.enum(VOLUNTEER_STATUSES).optional(),
  committeeNotes: z.string().trim().max(4000).optional(),
});

export async function createCommitteeVolunteerAction(raw: unknown) {
  const auth = await requireAuth("volunteer.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  const parsed = committeeVolunteerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, error: "Please correct the volunteer details." };

  const result = await createCommitteeVolunteer(parsed.data);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "volunteer.committee_created",
      entityType: "volunteer",
      entityId: result.id,
      actorId: auth.user.id,
    });
    revalidatePath("/dashboard/volunteers");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function createTaskAction(raw: unknown) {
  const auth = await requireAuth("task.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  const result = await createTask(raw, auth.user.id);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "task.created",
      entityType: "task",
      entityId: result.id,
      actorId: auth.user.id,
    });
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
    const event = getActiveEventConfig();
    if (typeof patch.status === "string") {
      await logActivity({
        eventSlug: event.slug,
        action: "task.status_updated",
        entityType: "task",
        entityId: id,
        actorId: auth.user.id,
        metadata: { status: patch.status },
      });
    } else if (typeof patch.priority === "string") {
      await logActivity({
        eventSlug: event.slug,
        action: "task.priority_updated",
        entityType: "task",
        entityId: id,
        actorId: auth.user.id,
        metadata: { priority: patch.priority },
      });
    } else {
      await logActivity({
        eventSlug: event.slug,
        action: "task.updated",
        entityType: "task",
        entityId: id,
        actorId: auth.user.id,
      });
    }
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function deleteTaskAction(id: string) {
  const auth = await requireAuth("task.write");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid record." };

  const result = await deleteTask(id);
  if (result.ok) {
    const event = getActiveEventConfig();
    await logActivity({
      eventSlug: event.slug,
      action: "task.deleted",
      entityType: "task",
      entityId: id,
      actorId: auth.user.id,
    });
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

/** Shared entity activity fetch for detail drawers (sponsor / volunteer / task / rsvp). */
export async function fetchEntityActivityAction(entityType: string, id: string) {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false as const, error: auth.message, items: [] };
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false as const, error: "Invalid record.", items: [] };
  const items = await fetchEntityActivity(entityType, parsedId.data);
  return { ok: true as const, items };
}

export async function listCommitteeProfilesAction() {
  const auth = await requireAuth("user.manage");
  if (!auth.ok) return { ok: false as const, error: auth.message, profiles: [] };
  return listProfiles();
}

const roleSchema = z.enum(PLATFORM_ROLES);

export async function updateProfileRoleAction(
  id: string,
  patch: { role?: string; isActive?: boolean },
) {
  const auth = await requireAuth("user.manage");
  if (!auth.ok) return { ok: false as const, error: auth.message };
  if (!idSchema.safeParse(id).success) return { ok: false as const, error: "Invalid account." };
  if (id === auth.user.id && patch.isActive === false) {
    return { ok: false as const, error: "You cannot deactivate your own account." };
  }

  let role: PlatformRole | undefined;
  if (patch.role !== undefined) {
    const parsedRole = roleSchema.safeParse(patch.role);
    if (!parsedRole.success) return { ok: false as const, error: "Invalid role." };
    role = parsedRole.data;
  }

  const result = await updateProfileRole(id, { role, isActive: patch.isActive });
  if (result.ok) {
    const event = getActiveEventConfig();
    if (role) {
      await logActivity({
        eventSlug: event.slug,
        action: "user.role_updated",
        entityType: "user",
        entityId: id,
        actorId: auth.user.id,
        metadata: { role },
      });
    }
    if (patch.isActive !== undefined) {
      await logActivity({
        eventSlug: event.slug,
        action: "user.status_updated",
        entityType: "user",
        entityId: id,
        actorId: auth.user.id,
        metadata: { isActive: patch.isActive },
      });
    }
    revalidatePath("/dashboard/settings");
  }
  return result;
}

export async function signOutAction() {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}
