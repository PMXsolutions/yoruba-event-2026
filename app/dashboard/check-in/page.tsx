import { requireAuth } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";
import { getFeatureFlags } from "@/lib/feature-flags";
import { fetchSeatingAssignments } from "@/platform/engines/seating/queries";
import { CheckInPanel } from "@/components/dashboard/CheckInPanel";
import { IntegrationBanner } from "@/components/dashboard/dashboard-ui";

export const dynamic = "force-dynamic";

export default async function CheckInPage() {
  const auth = await requireAuth("rsvp.write");
  if (!auth.ok) redirect("/login?redirect=/dashboard/check-in");

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
