"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/rbac";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendViaSmtp } from "@/platform/engines/notifications/email/smtp-client";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/activity/log";
const roles = z.enum(["SUPER_ADMIN", "ADMIN", "COMMITTEE", "VOLUNTEER"]);
const inviteSchema = z.object({ name: z.string().trim().min(1).max(120), email: z.string().trim().toLowerCase().email().max(254) });
export async function changeMemberAccess(raw: unknown) {
    const auth = await requireAuth("user.manage");
    if (!auth.ok)
        return { ok: false, message: auth.message };
    const input = z.object({ id: z.string().uuid(), role: roles, active: z.boolean() }).safeParse(raw);
    if (!input.success)
        return { ok: false, message: "Invalid member access." };
    if (input.data.id === auth.user.id)
        return { ok: false, message: "Ask another Super Admin to change your own access." };
    const client = await createServerSupabaseClient();
    const { error } = await client.rpc("manage_member_access", { target_id: input.data.id, member_role: input.data.role, active: input.data.active });
    if (error)
        return { ok: false, message: "Access could not be updated. Refresh and try again. If this continues, contact your administrator." };
    revalidatePath("/dashboard/members");
    return { ok: true, message: "Member access updated." };
}
export async function inviteMember(raw: unknown) {
    const auth = await requireAuth("user.manage");
    if (!auth.ok)
        return { ok: false, message: auth.message };
    const input = inviteSchema.safeParse(raw);
    if (!input.success)
        return { ok: false, message: "Enter a name and valid email address." };
    if (!checkRateLimit(`member-invite:${auth.user.id}`, 10, 60000).allowed)
        return { ok: false, message: "Please wait a minute before sending more invitations." };
    const db = createServiceRoleClient();
    const { data: existing, error: lookupError } = await db.from("profiles").select("id,is_active").eq("email", input.data.email).maybeSingle();
    if (lookupError)
        return { ok: false, message: "Unable to check existing membership." };
    if (existing && !existing.is_active)
        return { ok: false, message: "This member is inactive. Activate their access before sending a setup link." };
    // Existing access is never changed by sending or resending an invitation.
    const { data, error } = await db.auth.admin.generateLink(existing
        ? { type: "recovery", email: input.data.email }
        : { type: "invite", email: input.data.email, options: { data: { full_name: input.data.name } } });
    if (error || !data?.user || !data.properties?.hashed_token)
        return { ok: false, message: "Unable to create the invitation. Check the email and try again." };
    if (!existing) {
        const client = await createServerSupabaseClient();
        const { error: accessError } = await client.rpc("manage_member_access", { target_id: data.user.id, member_role: "COMMITTEE", active: true });
        if (accessError)
            return { ok: false, message: "Account created but access is inactive. Activate it in Members, then resend the invitation." };
    }
    else if (!existing.is_active) {
        return { ok: false, message: "This member is inactive. Activate their access before sending a setup link." };
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://yoruba-event-2026-eight.vercel.app";
    const link = new URL("/account/setup", origin);
    // Fragment keeps credentials out of server access logs and Referer headers.
    link.hash = new URLSearchParams({ token_hash: data.properties.hashed_token, type: existing ? "recovery" : "invite" }).toString();
    const text = `You have been invited to the Yoruba Day committee portal.\n\nSet your password using this one-time link:\n${link}\n\nIf the link has expired, ask your administrator to resend it. If you did not expect this invitation, ignore this email.`;
    const result = await sendViaSmtp({ to: input.data.email, subject: "Your committee portal access — Yoruba Day Canberra", text, html: `<p>You have been invited to the Yoruba Day committee portal.</p><p><a href="${link.toString().replaceAll('&', '&amp;')}">Set your password</a></p><p>This link can be used once. If it expires, ask your administrator to resend it. If you did not expect this invitation, ignore this email.</p>` });
    await logActivity({ eventSlug: "yoruba-day-canberra-2026", action: result.ok ? "member.invitation_sent" : "member.invitation_failed", entityType: "member", entityId: data.user.id, actorId: auth.user.id });
    revalidatePath("/dashboard/members");
    return { ok: result.ok, message: result.ok ? "Setup email accepted by the mail server. Ask the member to check Inbox and Spam." : "Member saved, but the setup email failed. Use Resend setup email to try again." };
}
