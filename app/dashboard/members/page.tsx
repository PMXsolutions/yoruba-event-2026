import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";
import { dbQuery } from "@/lib/db/query";
import { asIso, asMetadata } from "@/lib/db/values";
import { MemberManagementPanel } from "@/components/dashboard/MemberManagementPanel";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const auth = await requireAuth("user.manage");
  if (!auth.ok) redirect("/dashboard");

  let failed = false;
  let members: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
  }[] = [];
  let events: {
    id: string;
    action: string;
    entity_id: string | null;
    actor_id: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
  }[] = [];

  try {
    const memberRows = await dbQuery<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      is_active: boolean | number;
    }>(`SELECT id, email, full_name, role, is_active FROM profiles ORDER BY full_name`);
    const eventRows = await dbQuery<{
      id: string;
      action: string;
      entity_id: string | null;
      actor_id: string | null;
      created_at: string | Date;
      metadata: string | null;
    }>(
      `SELECT TOP 30 id, action, entity_id, actor_id, created_at, metadata
       FROM activity_logs WHERE entity_type = N'member' ORDER BY created_at DESC`,
    );
    members = memberRows.map((member) => ({
      ...member,
      is_active: member.is_active === true || member.is_active === 1,
    }));
    events = eventRows.map((event) => ({
      ...event,
      created_at: asIso(event.created_at) ?? "",
      metadata: asMetadata(event.metadata),
    }));
  } catch {
    failed = true;
  }

  if (failed) {
    return <p role="alert">Unable to load members. Please refresh and try again.</p>;
  }

  return <MemberManagementPanel members={members} currentId={auth.user.id} events={events} />;
}
