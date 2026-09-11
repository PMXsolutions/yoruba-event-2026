import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/rbac";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { MemberManagementPanel } from "@/components/dashboard/MemberManagementPanel";
export const dynamic = "force-dynamic";
export default async function MembersPage() {
    const auth = await requireAuth("user.manage");
    if (!auth.ok)
        redirect("/dashboard");
    const db = createServiceRoleClient();
    const { data, error } = await db.from("profiles").select("id,email,full_name,role,is_active").order("full_name");
    if (error)
        return <p role="alert">Unable to load members. Please refresh and try again.</p>;
    const { data: events } = await db.from("activity_logs").select("id,action,entity_id,actor_id,created_at,metadata").eq("entity_type", "member").order("created_at", { ascending: false }).limit(30);
    return <MemberManagementPanel members={data ?? []} currentId={auth.user.id} events={events ?? []}/>;
}
