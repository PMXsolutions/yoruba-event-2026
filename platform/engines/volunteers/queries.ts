import { assertPermission } from "@/lib/auth/rbac";
import "server-only";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbQuery } from "@/lib/db/query";
import { asIso, asStringArray, jsonText } from "@/lib/db/values";
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
  skills: string | string[] | null;
  availability: string | null;
  area_of_interest: string | null;
  assigned_role: string | null;
  notes: string | null;
  committee_notes: string | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
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
    skills: asStringArray(row.skills),
    availability: row.availability,
    areaOfInterest: row.area_of_interest,
    assignedRole: row.assigned_role,
    notes: row.notes,
    committeeNotes: row.committee_notes,
    status,
    createdAt: asIso(row.created_at) ?? "",
    updatedAt: asIso(row.updated_at) ?? "",
  };
}

export type SubmitVolunteerResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof VolunteerFormValues, string>> };

export async function submitVolunteerRegistration(raw: unknown): Promise<SubmitVolunteerResult> {
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

  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return { ok: false, error: "Registration is temporarily unavailable. Please try again later." };
  }

  const event = getActiveEventConfig();
  const d = parsed.data;
  const skills = d.skills
    ? d.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  try {
    await dbExec(
      `INSERT INTO volunteers (
         event_slug, full_name, email, phone, skills, availability, area_of_interest, notes, status
       ) VALUES (
         @slug, @fullName, @email, @phone, @skills, @availability, @areaOfInterest, @notes, N'new'
       )`,
      {
        slug: event.slug,
        fullName: d.fullName,
        email: d.email.toLowerCase(),
        phone: d.phone ?? null,
        skills: jsonText(skills),
        availability: d.availability ?? null,
        areaOfInterest: d.areaOfInterest ?? null,
        notes: d.notes ?? null,
      },
    );
    return { ok: true };
  } catch (error) {
    console.error("[volunteers] Insert failed:", errorMessage(error));
    return { ok: false, error: "Something went wrong while submitting. Please try again." };
  }
}

export type FetchVolunteersResult =
  | { ok: true; records: VolunteerRecord[] }
  | { ok: false; message: string };

export async function fetchVolunteers(): Promise<FetchVolunteersResult> {
  await assertPermission("volunteer.read");
  const env = getDatabaseEnvPresence();
  if (!env.ready) return { ok: false, message: "Database is not configured." };
  const event = getActiveEventConfig();
  try {
    const rows = await dbQuery<VolunteerRow>(
      `SELECT id, full_name, email, phone, skills, availability, area_of_interest, assigned_role, notes, committee_notes, status, created_at, updated_at
       FROM volunteers WHERE event_slug = @slug ORDER BY created_at DESC`,
      { slug: event.slug },
    );
    return { ok: true, records: rows.map(mapRow) };
  } catch (error) {
    console.error("[volunteers] Query failed:", errorMessage(error));
    return { ok: false, message: "Unable to load volunteers." };
  }
}

export async function updateVolunteerStatus(
  id: string,
  status: VolunteerStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const updated = await dbExec(
      `UPDATE volunteers SET status = @status, updated_at = SYSDATETIMEOFFSET() WHERE id = @id`,
      { id, status },
    );
    if (updated === 0) return { ok: false, error: "Could not update status." };
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
    const updated = await dbExec(
      `UPDATE volunteers
       SET assigned_role = @assignedRole, committee_notes = @committeeNotes, updated_at = SYSDATETIMEOFFSET()
       WHERE id = @id`,
      {
        id,
        assignedRole: assignedRole.trim() || null,
        committeeNotes: committeeNotes.trim() || null,
      },
    );
    if (updated === 0) return { ok: false, error: "Could not save volunteer profile." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save volunteer profile." };
  }
}
