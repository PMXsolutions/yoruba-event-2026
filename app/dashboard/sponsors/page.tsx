import { EmptyState, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { SponsorManagementPanel } from "@/components/dashboard/SponsorManagementPanel";
import { SponsorshipAccountForm } from "@/components/dashboard/SponsorshipAccountForm";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { fetchSponsorshipAccount } from "@/platform/engines/sponsors/account-store";
import { fetchSponsors } from "@/platform/engines/sponsors/queries";

export const dynamic = "force-dynamic";

export default async function DashboardSponsorsPage() {
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

  const packages = getActiveEventConfig().sponsorTiers.map((tier) => tier.name);
  const account = await fetchSponsorshipAccount();

  return (
    <div className="space-y-6">
      <SponsorshipAccountForm
        account={account.ok ? account.account : null}
        unavailable={account.ok ? null : account.message}
      />
      <SponsorManagementPanel records={result.records} packages={packages} />
    </div>
  );
}
