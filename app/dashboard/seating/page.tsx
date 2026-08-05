import { getFeatureFlags } from "@/lib/feature-flags";
import {
  fetchFloorPlans,
  fetchSeatingAssignments,
  fetchSeatingTables,
} from "@/platform/engines/seating/queries";
import { fetchDashboardRsvps } from "@/platform/engines/dashboard/rsvp/queries";
import { SeatingManagementPanel } from "@/components/dashboard/SeatingManagementPanel";
import { IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { requireDashboardPage } from "@/lib/auth/page-gate";
import { hasPermission } from "@/lib/auth/rbac";

export const dynamic = "force-dynamic";

export default async function SeatingPage() {
  const user = await requireDashboardPage("seating.read");
  const canWrite = hasPermission(user, "seating.write");

  const flags = getFeatureFlags();
  if (!flags.SEATING_ENABLED) {
    return (
      <IntegrationBanner title="Seating disabled" variant="warning">
        SEATING_ENABLED is off for this deployment.
      </IntegrationBanner>
    );
  }

  const [tables, assignments, plans, rsvps] = await Promise.all([
    fetchSeatingTables(),
    fetchSeatingAssignments(),
    fetchFloorPlans(),
    fetchDashboardRsvps(),
  ]);

  const guests =
    rsvps.ok
      ? rsvps.records.map((r) => ({
          id: r.id,
          fullName: r.fullName,
          email: r.email,
          reference: r.registrationReference,
          status: r.status,
        }))
      : [];

  return (
    <SeatingManagementPanel
      tables={tables}
      assignments={assignments}
      floorPlans={plans}
      guests={guests}
      canWrite={canWrite}
    />
  );
}
