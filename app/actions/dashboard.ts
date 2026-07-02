"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/rbac";
import { sendMail } from "@/lib/mail";
import type { RsvpRow } from "@/lib/database/types";
import * as XLSX from "xlsx";

export async function updateRsvp(
  id: string,
  data: Partial<Pick<RsvpRow, "full_name" | "email" | "phone" | "number_of_attendees" | "ticket_type" | "notes">>,
) {
  await requireAuth("rsvp.write");
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("rsvps").update({ ...data, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteRsvp(id: string) {
  await requireAuth("rsvp.write");
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("rsvps").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function sendRsvpEmail(id: string, subject: string, body: string) {
  await requireAuth("rsvp.write");
  const supabase = createServiceRoleClient();
  const { data: rsvp } = await supabase.from("rsvps").select("email, full_name").eq("id", id).single();
  if (!rsvp) throw new Error("RSVP not found");

  const result = await sendMail({
    to: rsvp.email,
    subject,
    html: `<p>Dear ${rsvp.full_name},</p><p>${body}</p>`,
    text: `Dear ${rsvp.full_name},\n\n${body}`,
  });

  if (!result.ok) throw new Error(result.message);
  return { ok: true };
}

export async function updateSponsorStatus(id: string, status: "approved" | "rejected") {
  await requireAuth("sponsor.write");
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("sponsors")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function updateVolunteer(
  id: string,
  data: { status?: string; assignment?: string; notes?: string },
) {
  await requireAuth("volunteer.write");
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("volunteers")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function publishAnnouncement(data: { title: string; content: string; publish: boolean }) {
  await requireAuth("announcement.write");
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("announcements").insert({
    title: data.title,
    content: data.content,
    is_published: data.publish,
    published_at: data.publish ? new Date().toISOString() : null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function exportRsvpsCsv(): Promise<string> {
  await requireAuth("rsvp.export");
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsvps").select("*").order("created_at", { ascending: false });
  const rows = data ?? [];
  const header = ["id", "registration_reference", "full_name", "email", "phone", "number_of_attendees", "ticket_type", "notes", "created_at"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      header.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(","),
    ),
  ];
  return lines.join("\n");
}

export async function exportRsvpsExcel(): Promise<Buffer> {
  await requireAuth("rsvp.export");
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsvps").select("*").order("created_at", { ascending: false });
  const ws = XLSX.utils.json_to_sheet(data ?? []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "RSVPs");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

export async function exportSponsorsCsv(): Promise<string> {
  await requireAuth("sponsor.export");
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("sponsors").select("*").order("created_at", { ascending: false });
  const rows = data ?? [];
  const header = ["id", "company", "contact_person", "email", "phone", "website", "package", "status", "created_at"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      header.map((h) => `"${String(r[h as keyof typeof r] ?? "").replace(/"/g, '""')}"`).join(","),
    ),
  ];
  return lines.join("\n");
}

export async function signOut() {
  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
}
