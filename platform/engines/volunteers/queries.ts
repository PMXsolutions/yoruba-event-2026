import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import {
  volunteerFormSchema,
  type VolunteerFormValues,
  type VolunteerRecord,
  type VolunteerStatus,
  VOLUNTEER_STATUSES,
} from "@/platform/engines/volunteers/schema";

type VolunteerRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  skills: string[] | null;
  availability: string | null;
  area_of_interest: string | null;
  assigned_role: string | null;
  notes: string | null;
  committee_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: VolunteerRow): VolunteerRecord {
  const status = (VOLUNTEER_STATUSES as readonly string[]).includes(row.status)
    ? (row.status as VolunteerStatus)
    : "new";
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    skills: row.skills ?? [],
    availability: row.availability,
    areaOfInterest: row.area_of_interest,
    assignedRole: row.assigned_role,
    notes: row.notes,
    committeeNotes: row.committee_notes,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SubmitVolunteerResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof VolunteerFormValues, string>> };

export async function submitVolunteerRegistration(
  raw: unknown,
): Promise<SubmitVolunteerResult> {
  const parsed = volunteerFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof VolunteerFormValues, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as keyof VolunteerFormValues] = issue.message;
      }
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return { ok: false, error: "Registration is temporarily unavailable. Please try again later." };
  }

  const event = getActiveEventConfig();
  const d = parsed.data;
  const skills = d.skills
    ? d.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("volunteers").insert({
      event_slug: event.slug,
      full_name: d.fullName,
      email: d.email.toLowerCase(),
      phone: d.phone ?? null,
      skills,
      availability: d.availability ?? null,
      area_of_interest: d.areaOfInterest ?? null,
      notes: d.notes ?? null,
      status: "new",
    });
    if (error) {
      console.error("[volunteers] Insert failed:", error.message);
      return { ok: false, error: "Something went wrong while submitting. Please try again." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[volunteers] Unexpected:", e);
    return { ok: false, error: "Something went wrong while submitting. Please try again." };
  }
}

export type FetchVolunteersResult =
  | { ok: true; records: VolunteerRecord[] }
  | { ok: false; message: string };

export async function fetchVolunteers(): Promise<FetchVolunteersResult> {
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ok: false, message: "Database is not configured." };
  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("volunteers")
      .select("*")
      .eq("event_slug", event.slug)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[volunteers] Query failed:", error.message);
      return { ok: false, message: "Unable to load volunteers." };
    }
    return { ok: true, records: (data ?? []).map((r) => mapRow(r as VolunteerRow)) };
  } catch {
    return { ok: false, message: "Unable to load volunteers." };
  }
}

export async function updateVolunteerStatus(
  id: string,
  status: VolunteerStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("volunteers").update({ status }).eq("id", id);
    if (error) return { ok: false, error: "Could not update status." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update status." };
  }
}

export async function updateVolunteerAssignment(
  id: string,
  assignedRole: string,
  committeeNotes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("volunteers")
      .update({
        assigned_role: assignedRole.trim() || null,
        committee_notes: committeeNotes.trim() || null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: "Could not save volunteer profile." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save volunteer profile." };
  }
}
