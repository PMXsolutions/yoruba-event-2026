import { EmptyState, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { VolunteerManagementPanel } from "@/components/dashboard/VolunteerManagementPanel";
import { fetchVolunteers } from "@/platform/engines/volunteers/queries";

export const dynamic = "force-dynamic";

export default async function DashboardVolunteersPage() {
  const result = await fetchVolunteers();

  if (!result.ok) {
    return (
      <>
        <IntegrationBanner title="Unable to load volunteers" variant="warning">
          {result.message}
        </IntegrationBanner>
        <EmptyState
          title="Volunteer data unavailable"
          message="Connect Supabase to load volunteer registrations."
        />
      </>
    );
  }

  return <VolunteerManagementPanel records={result.records} />;
}
