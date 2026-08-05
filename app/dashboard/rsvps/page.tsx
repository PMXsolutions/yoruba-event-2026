import { EmptyState, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { RsvpManagementPanel } from "@/components/dashboard/RsvpManagementPanel";
import { fetchDashboardRsvps } from "@/platform/engines/dashboard/rsvp/queries";
import { requireDashboardPage } from "@/lib/auth/page-gate";

export const dynamic = "force-dynamic";

export default async function DashboardRsvpsPage() {
  await requireDashboardPage("rsvp.read");
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

  return <RsvpManagementPanel records={result.records} />;
}
