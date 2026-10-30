import { assertPermission } from "@/lib/auth/rbac";
import "server-only";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbQuery } from "@/lib/db/query";
import { asIso } from "@/lib/db/values";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import {
  createSponsorFormSchema,
  type SponsorFormValues,
  type SponsorRecord,
  type SponsorStatus,
  SPONSOR_STATUSES,
} from "@/platform/engines/sponsors/schema";

type SponsorRow = {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string | null;
  website: string | null;
  package: string;
  message: string | null;
  logo_url: string | null;
  status: string;
  committee_notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function mapRow(row: SponsorRow): SponsorRecord {
  const status = (SPONSOR_STATUSES as readonly string[]).includes(row.status)
    ? (row.status as SponsorStatus)
    : "new";
  return {
    id: row.id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    website: row.website,
    package: row.package,
    message: row.message,
    logoUrl: row.logo_url,
    status,
    committeeNotes: row.committee_notes,
    createdAt: asIso(row.created_at) ?? "",
    updatedAt: asIso(row.updated_at) ?? "",
  };
}

export type SubmitSponsorResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof SponsorFormValues, string>> };

export async function submitSponsorEnquiry(raw: unknown): Promise<SubmitSponsorResult> {
  const event = getActiveEventConfig();
  const packages = event.sponsorTiers.map((t) => t.name);
  const parsed = createSponsorFormSchema(packages).safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof SponsorFormValues, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as keyof SponsorFormValues] = issue.message;
      }
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const env = getDatabaseEnvPresence();
  if (!env.ready) {
    return { ok: false, error: "Registration is temporarily unavailable. Please try again later." };
  }

  try {
    const d = parsed.data;
    await dbExec(
      `INSERT INTO sponsors (
         event_slug, company_name, contact_person, email, phone, website, package, message, logo_url, status
       ) VALUES (
         @slug, @companyName, @contactPerson, @email, @phone, @website, @package, @message, @logoUrl, N'new'
       )`,
      {
        slug: event.slug,
        companyName: d.companyName,
        contactPerson: d.contactPerson,
        email: d.email.toLowerCase(),
        phone: d.phone ?? null,
        website: d.website ?? null,
        package: d.package,
        message: d.message ?? null,
        logoUrl: d.logoUrl ?? null,
      },
    );
    return { ok: true };
  } catch (error) {
    console.error("[sponsors] Insert failed:", errorMessage(error));
    return { ok: false, error: "Something went wrong while submitting your enquiry. Please try again." };
  }
}

export type FetchSponsorsResult =
  | { ok: true; records: SponsorRecord[] }
  | { ok: false; message: string };

export async function fetchSponsors(): Promise<FetchSponsorsResult> {
  await assertPermission("sponsor.read");
  const env = getDatabaseEnvPresence();
  if (!env.ready) return { ok: false, message: "Database is not configured." };

  const event = getActiveEventConfig();
  try {
    const rows = await dbQuery<SponsorRow>(
      `SELECT id, company_name, contact_person, email, phone, website, package, message, logo_url, status, committee_notes, created_at, updated_at
       FROM sponsors WHERE event_slug = @slug ORDER BY created_at DESC`,
      { slug: event.slug },
    );
    return { ok: true, records: rows.map(mapRow) };
  } catch (error) {
    console.error("[sponsors] Query failed:", errorMessage(error));
    return { ok: false, message: "Unable to load sponsors." };
  }
}

export async function updateSponsorStatus(
  id: string,
  status: SponsorStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const updated = await dbExec(
      `UPDATE sponsors SET status = @status, updated_at = SYSDATETIMEOFFSET() WHERE id = @id`,
      { id, status },
    );
    if (updated === 0) return { ok: false, error: "Could not update status." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update status." };
  }
}

export async function updateSponsorNotes(
  id: string,
  notes: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const trimmed = notes.trim().slice(0, 4000);
  try {
    const updated = await dbExec(
      `UPDATE sponsors SET committee_notes = @notes, updated_at = SYSDATETIMEOFFSET() WHERE id = @id`,
      { id, notes: trimmed || null },
    );
    if (updated === 0) return { ok: false, error: "Could not save notes." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save notes." };
  }
}
