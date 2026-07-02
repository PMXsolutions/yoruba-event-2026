"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { volunteerFormSchema } from "@/lib/validation/volunteer";

export type SubmitVolunteerState =
  | { ok: true }
  | { ok: false; error: string };

export async function submitVolunteer(raw: unknown): Promise<SubmitVolunteerState> {
  const parsed = volunteerFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please correct the highlighted fields." };
  }

  const env = getSupabaseEnvPresence();
  if (!env.allPresent) {
    return { ok: false, error: "Registration is temporarily unavailable." };
  }

  const data = parsed.data;
  const skills = data.skills
    ? data.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("volunteers").insert({
      full_name: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone ?? null,
      skills,
      availability: data.availability ?? null,
      status: "pending",
    });

    if (error) {
      console.error("[volunteer] Insert error:", error.message);
      return { ok: false, error: "Unable to save your registration. Please try again." };
    }

    return { ok: true };
  } catch (e) {
    console.error("[volunteer] Unexpected error:", e);
    return { ok: false, error: "An unexpected error occurred." };
  }
}
