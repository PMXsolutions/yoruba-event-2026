import { getFeatureFlags } from "@/lib/feature-flags";
import { fetchSeatingAssignments } from "@/platform/engines/seating/queries";
import { CheckInPanel } from "@/components/dashboard/CheckInPanel";
import { IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { requireDashboardPage } from "@/lib/auth/page-gate";

export const dynamic = "force-dynamic";

export default async function CheckInPage() {
  await requireDashboardPage("checkin.write");

  const flags = getFeatureFlags();
  if (!flags.QR_CHECKIN_ENABLED) {
    return (
      <IntegrationBanner title="Check-in disabled" variant="warning">
        QR_CHECKIN_ENABLED is off for this deployment.
      </IntegrationBanner>
    );
  }

  const assignments = await fetchSeatingAssignments();
  return <CheckInPanel assignments={assignments} />;
}
