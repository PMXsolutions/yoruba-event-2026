import { EmptyState, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { RsvpManagementPanel } from "@/components/dashboard/RsvpManagementPanel";
import { fetchDashboardRsvps } from "@/platform/engines/dashboard/rsvp/queries";

export const dynamic = "force-dynamic";

export default async function DashboardRsvpsPage() {
  const result = await fetchDashboardRsvps();

  if (!result.ok) {
    return (
      <>
        <IntegrationBanner title="Unable to load RSVPs" variant="warning">
          {result.message}
        </IntegrationBanner>
        <EmptyState
          title="RSVP data unavailable"
          message="Connect Supabase and apply migrations to load Register Interest records."
        />
      </>
    );
  }

  return <><a className="inline-block rounded bg-amber-800 px-4 py-2 text-white mb-4" href="/dashboard/seating">Seating assignments and confirmation delivery</a><RsvpManagementPanel records={result.records} /></>;
}
