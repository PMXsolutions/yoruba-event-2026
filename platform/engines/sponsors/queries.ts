import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
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
  created_at: string;
  updated_at: string;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type SubmitSponsorResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof SponsorFormValues, string>> };

export async function submitSponsorEnquiry(
  raw: unknown,
): Promise<SubmitSponsorResult> {
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

  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) {
    return { ok: false, error: "Registration is temporarily unavailable. Please try again later." };
  }

  try {
    const supabase = createServiceRoleClient();
    const d = parsed.data;
    const { error } = await supabase.from("sponsors").insert({
      event_slug: event.slug,
      company_name: d.companyName,
      contact_person: d.contactPerson,
      email: d.email.toLowerCase(),
      phone: d.phone ?? null,
      website: d.website ?? null,
      package: d.package,
      message: d.message ?? null,
      logo_url: d.logoUrl ?? null,
      status: "new",
    });
    if (error) {
      console.error("[sponsors] Insert failed:", error.message);
      return { ok: false, error: "Something went wrong while submitting your enquiry. Please try again." };
    }
    return { ok: true };
  } catch (e) {
    console.error("[sponsors] Unexpected:", e);
    return { ok: false, error: "Something went wrong while submitting your enquiry. Please try again." };
  }
}

export type FetchSponsorsResult =
  | { ok: true; records: SponsorRecord[] }
  | { ok: false; message: string };

export async function fetchSponsors(): Promise<FetchSponsorsResult> {
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ok: false, message: "Database is not configured." };

  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("sponsors")
      .select("*")
      .eq("event_slug", event.slug)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[sponsors] Query failed:", error.message);
      return { ok: false, message: "Unable to load sponsors." };
    }
    return { ok: true, records: (data ?? []).map((r) => mapRow(r as SponsorRow)) };
  } catch (e) {
    console.error("[sponsors] Unexpected:", e);
    return { ok: false, message: "Unable to load sponsors." };
  }
}

export async function updateSponsorStatus(
  id: string,
  status: SponsorStatus,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("sponsors").update({ status }).eq("id", id);
    if (error) return { ok: false, error: "Could not update status." };
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
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("sponsors")
      .update({ committee_notes: trimmed || null })
      .eq("id", id);
    if (error) return { ok: false, error: "Could not save notes." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not save notes." };
  }
}
