"use client";
import { useState, useTransition } from "react";
import { inviteMember, changeMemberAccess } from "@/app/actions/members";
type Member = {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
};
type Event = {
    id: string;
    action: string;
    entity_id: string | null;
    actor_id: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
};
const labels: Record<string, string> = { SUPER_ADMIN: "Super Admin · manages members", ADMIN: "Admin · all event work", COMMITTEE: "Committee · event work", VOLUNTEER: "Volunteer · view progress" };
const field = "w-full rounded-xl border border-mahogany/20 bg-white px-3 py-2 text-sm";
const button = "rounded-xl border border-mahogany/20 px-4 py-2 text-sm font-semibold disabled:opacity-40 hover:bg-gold/10";
function MemberRow({ member, currentId, run, pending }: {
    member: Member;
    currentId: string;
    run: (fn: () => Promise<{
        ok: boolean;
        message: string;
    }>) => void;
    pending: boolean;
}) {
    const [role, setRole] = useState(member.role);
    const [active, setActive] = useState(member.is_active);
    const own = member.id === currentId;
    return <article className="grid gap-4 border-t border-mahogany/10 py-5 lg:grid-cols-[1fr_1fr_auto]">
    <div className="min-w-0"><p className="font-semibold">{member.full_name || member.email}{own ? " (you)" : ""}</p><p className="break-all text-sm text-mahogany/65">{member.email}</p><p className="mt-1 text-xs">{member.is_active ? "Access active" : "Access inactive"}</p></div>
    <div className="space-y-2"><label className="block text-xs">Role<select className={field} aria-label={`Role for ${member.email}`} disabled={own || pending} value={role} onChange={e => setRole(e.target.value)}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} disabled={own || pending} onChange={e => setActive(e.target.checked)}/>Allow portal access</label></div>
    <div className="flex flex-wrap items-center gap-2"><button className={button} disabled={own || pending || (role === member.role && active === member.is_active)} onClick={() => { if (window.confirm(`Save ${labels[role]} access for ${member.email}? Portal access will be ${active ? "active" : "inactive"}.`))
        run(() => changeMemberAccess({ id: member.id, role, active })); }}>Save access</button><button className={button} disabled={pending || !member.is_active} onClick={() => run(() => inviteMember({ name: member.full_name || member.email, email: member.email }))}>Resend setup email</button></div>
  </article>;
}
export function MemberManagementPanel({ members, currentId, events }: {
    members: Member[];
    currentId: string;
    events: Event[];
}) {
    const [pending, start] = useTransition();
    const [notice, setNotice] = useState<{
        ok: boolean;
        message: string;
    } | null>(null);
    const [search, setSearch] = useState("");
    function run(fn: () => Promise<{
        ok: boolean;
        message: string;
    }>) { start(async () => { setNotice(null); try {
        setNotice(await fn());
    }
    catch {
        setNotice({ ok: false, message: "The request could not finish. Refresh to check the result before trying again." });
    } }); }
    const name = (id: string | null) => members.find(m => m.id === id)?.full_name || members.find(m => m.id === id)?.email || "Administrator";
    return <div className="space-y-6">
    <section className="rounded-2xl border border-gold/20 bg-white p-6"><h2 className="font-display text-2xl">Invite a committee member</h2><p className="mt-2 text-sm text-mahogany/70">New members receive Committee access and an email to set their own password. Promote a trusted member to Super Admin to let them manage membership.</p>
      <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); run(() => inviteMember({ name: data.get("name"), email: data.get("email") })); }}><label className="text-sm">Full name<input name="name" autoComplete="name" required maxLength={120} className={field}/></label><label className="text-sm">Email<input name="email" type="email" autoComplete="email" required maxLength={254} className={field}/></label><button className={`${button} self-end bg-espresso text-cream`} disabled={pending}>{pending ? "Working…" : "Send invitation"}</button></form>
    </section>
    {notice && <p role={notice.ok ? "status" : "alert"} className={`rounded-xl border p-4 text-sm ${notice.ok ? "border-emerald-200 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>{notice.message}</p>}
    <section className="rounded-2xl border border-gold/20 bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">Members ({members.length})</h2><input aria-label="Search members" placeholder="Search name or email" className={`${field} max-w-sm`} value={search} onChange={e => setSearch(e.target.value)}/></div><p className="my-4 text-sm text-mahogany/70">Keep two trusted Super Admins for continuity. Another Super Admin must change your own access. Deactivation preserves the member’s work and blocks portal access.</p>{members.filter(m => `${m.full_name} ${m.email}`.toLowerCase().includes(search.toLowerCase())).map(m => <MemberRow key={`${m.id}-${m.role}-${m.is_active}`} member={m} currentId={currentId} run={run} pending={pending}/>)}</section>
    <section className="rounded-2xl border border-gold/20 bg-white p-6"><h2 className="font-display text-2xl">Recent membership activity</h2>{events.length === 0 ? <p className="mt-3 text-sm">No membership changes recorded yet.</p> : <ul className="mt-4 divide-y divide-mahogany/10">{events.map(e => <li key={e.id} className="py-3 text-sm"><p>{e.action.replace("member.", "").replaceAll("_", " ")} · {name(e.entity_id)}</p><p className="text-xs text-mahogany/65">By {name(e.actor_id)} · {new Date(e.created_at).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}</p>{e.action === "member.access_changed" && <p className="text-xs">{String(e.metadata?.role)} · {e.metadata?.active ? "Active" : "Inactive"}</p>}</li>)}</ul>}</section>
  </div>;
}
