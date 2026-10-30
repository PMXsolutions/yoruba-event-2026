"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/rbac";
import { issueAccountEmail } from "@/lib/auth/account-email";
import { dbOne, dbTransaction } from "@/lib/db/query";
import { jsonText } from "@/lib/db/values";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { logActivity } from "@/lib/activity/log";

const roles = z.enum(["SUPER_ADMIN", "ADMIN", "COMMITTEE", "VOLUNTEER"]);
const inviteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
});

const accessFailure = "Access could not be updated. Refresh and try again. If this continues, contact your administrator.";

export async function changeMemberAccess(raw: unknown) {
  const auth = await requireAuth("user.manage");
  if (!auth.ok) return { ok: false, message: auth.message };
  const input = z.object({ id: z.string().uuid(), role: roles, active: z.boolean() }).safeParse(raw);
  if (!input.success) return { ok: false, message: "Invalid member access." };
  if (input.data.id === auth.user.id) {
    return { ok: false, message: "Ask another Super Admin to change your own access." };
  }

  try {
    await dbTransaction(async (query) => {
      const actors = await query<{ id: string }>(
        `SELECT id FROM profiles WITH (UPDLOCK, HOLDLOCK)
         WHERE id = @actorId AND is_active = 1 AND role = N'SUPER_ADMIN'`,
        { actorId: auth.user.id },
      );
      if (actors.length === 0) throw new Error("Only active Super Admins can manage members");

      const previousRows = await query<{ id: string; role: string; is_active: boolean | number }>(
        `SELECT id, role, is_active FROM profiles WITH (UPDLOCK, HOLDLOCK) WHERE id = @targetId`,
        { targetId: input.data.id },
      );
      const previous = previousRows[0];
      if (!previous) throw new Error("Member not found");

      const wasActiveSuper = previous.role === "SUPER_ADMIN" && (previous.is_active === true || previous.is_active === 1);
      const staysActiveSuper = input.data.role === "SUPER_ADMIN" && input.data.active;
      if (wasActiveSuper && !staysActiveSuper) {
        const remaining = await query<{ remaining: number }>(
          `SELECT COUNT(*) AS remaining FROM profiles
           WHERE id <> @targetId AND role = N'SUPER_ADMIN' AND is_active = 1`,
          { targetId: input.data.id },
        );
        if ((remaining[0]?.remaining ?? 0) === 0) throw new Error("Keep at least one active Super Admin");
      }

      await query(
        `UPDATE profiles
         SET role = @role, is_active = @active, updated_at = SYSDATETIMEOFFSET()
         WHERE id = @targetId`,
        { targetId: input.data.id, role: input.data.role, active: input.data.active },
      );
      await query(
        `INSERT INTO activity_logs (event_slug, action, entity_type, entity_id, actor_id, metadata)
         VALUES (N'yoruba-day-canberra-2026', N'member.access_changed', N'member', @targetId, @actorId, @metadata)`,
        {
          targetId: input.data.id,
          actorId: auth.user.id,
          metadata: jsonText({
            previous_role: previous.role,
            role: input.data.role,
            previous_active: previous.is_active === true || previous.is_active === 1,
            active: input.data.active,
          }),
        },
      );
    });
  } catch (error) {
    console.error("[members] Access update failed:", error instanceof Error ? error.message : error);
    return { ok: false, message: accessFailure };
  }

  revalidatePath("/dashboard/members");
  return { ok: true, message: "Member access updated." };
}

export async function inviteMember(raw: unknown) {
  const auth = await requireAuth("user.manage");
  if (!auth.ok) return { ok: false, message: auth.message };
  const input = inviteSchema.safeParse(raw);
  if (!input.success) return { ok: false, message: "Enter a name and valid email address." };
  if (!checkRateLimit(`member-invite:${auth.user.id}`, 10, 60000).allowed) {
    return { ok: false, message: "Please wait a minute before sending more invitations." };
  }

  let profileId: string;
  try {
    const existing = await dbOne<{ id: string; is_active: boolean | number }>(
      `SELECT id, is_active FROM profiles WHERE email = @email`,
      { email: input.data.email },
    );
    if (existing && !(existing.is_active === true || existing.is_active === 1)) {
      return { ok: false, message: "This member is inactive. Activate their access before sending a setup link." };
    }
    if (existing) {
      profileId = existing.id;
    } else {
      profileId = randomUUID();
      await dbOne(
        `INSERT INTO profiles (id, email, full_name, role, is_active)
         OUTPUT INSERTED.id
         VALUES (@id, @email, @fullName, N'COMMITTEE', 1)`,
        { id: profileId, email: input.data.email, fullName: input.data.name },
      );
    }
  } catch (error) {
    console.error("[members] Invite lookup failed:", error instanceof Error ? error.message : error);
    return { ok: false, message: "Unable to check existing membership." };
  }

  let mailed = { ok: false };
  try {
    mailed = await issueAccountEmail({
      profileId,
      email: input.data.email,
      purpose: "invite",
      subject: "Your committee portal access — Yoruba Day Canberra",
      intro: "You have been invited to the Yoruba Day committee portal.",
    });
  } catch (error) {
    console.error("[members] Invitation email failed:", error instanceof Error ? error.message : error);
  }
  await logActivity({
    eventSlug: "yoruba-day-canberra-2026",
    action: mailed.ok ? "member.invitation_sent" : "member.invitation_failed",
    entityType: "member",
    entityId: profileId,
    actorId: auth.user.id,
  });
  revalidatePath("/dashboard/members");
  return {
    ok: mailed.ok,
    message: mailed.ok
      ? "Setup email accepted by the mail server. Ask the member to check Inbox and Spam."
      : "Member saved, but the setup email failed. Use Resend setup email to try again.",
  };
}
