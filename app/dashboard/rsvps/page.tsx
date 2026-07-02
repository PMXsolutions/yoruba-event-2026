import { RsvpManagementPanel } from "@/components/dashboard/RsvpManagementPanel";
import { demoDashboardRsvps } from "@/platform/engines/dashboard/rsvp/demo-data";
import { fetchDashboardRsvps } from "@/platform/engines/dashboard/rsvp/queries";

export const dynamic = "force-dynamic";

export default async function DashboardRsvpsPage() {
  const result = await fetchDashboardRsvps();
  const source = result.ok ? "live" : "demo";
  const records = result.ok ? result.records : demoDashboardRsvps();

  if (!result.ok) {
    console.info("[dashboard/rsvps] Using demo data:", result.reason);
  }

  return <RsvpManagementPanel records={records} source={source} />;
}
