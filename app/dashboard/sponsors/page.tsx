import { EmptyState, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { SponsorManagementPanel } from "@/components/dashboard/SponsorManagementPanel";
import { fetchSponsors } from "@/platform/engines/sponsors/queries";
import { requireDashboardPage } from "@/lib/auth/page-gate";

export const dynamic = "force-dynamic";

export default async function DashboardSponsorsPage() {
  await requireDashboardPage("sponsor.read");
  const result = await fetchSponsors();

  if (!result.ok) {
    return (
      <>
        <IntegrationBanner title="Unable to load sponsors" variant="warning">
          {result.message}
        </IntegrationBanner>
        <EmptyState
          title="Sponsor data unavailable"
          message="Connect Supabase to load partnership enquiries."
        />
      </>
    );
  }

  return <SponsorManagementPanel records={result.records} />;
}
