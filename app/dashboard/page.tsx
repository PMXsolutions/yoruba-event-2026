import { DashboardShell, PlaceholderPanel } from "@/components/dashboard/DashboardShell";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Organiser dashboard"
      description="Phase 2 scaffold — overview and quick stats will live here once authentication is implemented."
    >
      <div className="space-y-6">
        <PlaceholderPanel
          title="At a glance"
          items={[
            { label: "Interest registrations", value: "—" },
            { label: "Sponsor enquiries", value: "—" },
            { label: "Volunteers signed up", value: "—" },
            { label: "Open tasks", value: "—" },
          ]}
        />
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50 px-5 py-4 font-sans text-sm leading-relaxed text-amber-950">
          {/* TODO(phase-2): Gate /dashboard behind Supabase Auth or similar. */}
          <strong>Not yet protected.</strong> Do not share this URL publicly until authentication
          and permissions are in place. See <code className="text-xs">docs/PHASE_2_SPEC.md</code>.
        </section>
      </div>
    </DashboardShell>
  );
}
