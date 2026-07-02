"use server";

import { redirect } from "next/navigation";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { dispatchSponsorNotifications } from "@/platform/engines/notifications/dispatch";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { sponsorFormSchema, type SponsorFormValues } from "@/lib/validation/sponsor";

export type SubmitSponsorState =
  | { ok: true; id: string; emailSent?: boolean }
  | { ok: false; error: string; fieldErrors?: Partial<Record<keyof SponsorFormValues, string>> };

export async function submitSponsor(raw: unknown): Promise<SubmitSponsorState> {
  const parsed = sponsorFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof SponsorFormValues, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key as keyof SponsorFormValues]) {
        fieldErrors[key as keyof SponsorFormValues] = issue.message;
      }
    }
    return { ok: false, error: "Please correct the highlighted fields.", fieldErrors };
  }

  const env = getSupabaseEnvPresence();
  if (!env.allPresent) {
    return { ok: false, error: "Registration is temporarily unavailable. Please try again later." };
  }

  const data = parsed.data;
  let logoUrl: string | null = null;

  if (data.logoDataUrl?.startsWith("data:image/")) {
    logoUrl = data.logoDataUrl;
  }

  try {
    const supabase = createServiceRoleClient();
    const { data: row, error } = await supabase
      .from("sponsors")
      .insert({
        company: data.company,
        contact_person: data.contactPerson,
        email: data.email.toLowerCase(),
        phone: data.phone ?? null,
        website: data.website ?? null,
        package: data.package,
        logo_url: logoUrl,
        message: data.message ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("[sponsor] Insert error:", error?.message);
      return { ok: false, error: "Unable to save your enquiry. Please try again or email us directly." };
    }

    const event = getActiveEventConfig();
    let emailSent = false;
    try {
      const notify = await dispatchSponsorNotifications(event, {
        company: data.company,
        contactPerson: data.contactPerson,
        email: data.email,
        packageName: data.package,
      });
      emailSent = notify.emailSent;
    } catch (e) {
      console.warn("[sponsor] Email dispatch failed (non-fatal):", e);
    }

    return { ok: true, id: row.id, emailSent };
  } catch (e) {
    console.error("[sponsor] Unexpected error:", e);
    return { ok: false, error: "An unexpected error occurred. Please try again." };
  }
}

export async function submitSponsorAndRedirect(raw: unknown): Promise<never> {
  const result = await submitSponsor(raw);
  if (result.ok) {
    redirect(`/sponsor/confirmation?id=${result.id}`);
  }
  redirect("/sponsor/confirmation?error=1");
}
