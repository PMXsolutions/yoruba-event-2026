import {
  DashboardShell,
  DataTable,
  IntegrationBanner,
} from "@/components/dashboard/DashboardShell";
import { PLACEHOLDER_VOLUNTEERS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardVolunteersPage() {
  return (
    <DashboardShell
      title="Volunteer management"
      description="Coordinate volunteer roles, shifts, and contact details."
    >
      <IntegrationBanner title="Volunteer CRM Engine">
        {/* TODO(volunteer-crm): volunteer_signups table + shift scheduler. */}
        Recruitment opens when programme and venue are confirmed.
      </IntegrationBanner>

      <DataTable
        title="Volunteer roster"
        columns={["name", "role", "shift", "status"]}
        rows={PLACEHOLDER_VOLUNTEERS}
      />
    </DashboardShell>
  );
}
