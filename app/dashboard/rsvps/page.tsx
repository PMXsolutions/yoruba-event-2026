import {
  DashboardShell,
  DataTable,
  IntegrationBanner,
} from "@/components/dashboard/DashboardShell";
import { PLACEHOLDER_RSVPS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardRsvpsPage() {
  return (
    <DashboardShell
      title="RSVP management"
      description="View, search, and export interest registrations from the Promax RSVP Engine."
      actions={
        <span className="inline-flex cursor-not-allowed items-center rounded-full border border-white/10 bg-white/5 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-cream/40">
          Export CSV — soon
        </span>
      }
    >
      <IntegrationBanner title="RSVP Engine">
        {/* TODO(rsvp-engine): Query public.rsvps with pagination once auth is enabled. */}
        Live data connects via Supabase service role (server-side only). Run migration in{" "}
        <code className="text-xs">supabase/migrations/</code> then refresh. Confirmation emails
        activate with <code className="text-xs">RESEND_API_KEY</code>.
      </IntegrationBanner>

      <DataTable
        title="Recent registrations"
        columns={["name", "email", "guests", "ticket", "date"]}
        rows={PLACEHOLDER_RSVPS}
        emptyMessage="No live rows until Supabase migration is applied and auth is configured."
      />
    </DashboardShell>
  );
}
