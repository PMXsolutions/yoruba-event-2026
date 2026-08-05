import { EmptyState, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { ProgrammeManagementPanel } from "@/components/dashboard/ProgrammeManagementPanel";
import { fetchProgrammeItems } from "@/platform/engines/programme/queries";

export const dynamic = "force-dynamic";

export default async function DashboardProgrammePage() {
  const result = await fetchProgrammeItems();

  if (!result.ok) {
    return (
      <>
        <IntegrationBanner title="Unable to load programme" variant="warning">
          {result.message}
        </IntegrationBanner>
        <EmptyState
          title="Programme data unavailable"
          message="Connect Supabase to manage the run of show."
        />
      </>
    );
  }

  return <ProgrammeManagementPanel records={result.records} />;
}
