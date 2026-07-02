import { DataTable, IntegrationBanner, StatGrid } from "@/components/dashboard/dashboard-ui";
import { PLACEHOLDER_VOLUNTEERS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardVolunteersPage() {
  return (
    <>
      <IntegrationBanner title="Volunteer management — demo roster" variant="info">
        {/* TODO(volunteer-crm): Connect volunteer_signups when recruitment opens. */}
        Sample roster for committee preview. Shift scheduling activates with programme confirmation.
      </IntegrationBanner>

      <StatGrid
        stats={[
          { label: "Confirmed", value: "2", change: "Ready to assign", icon: "◎" },
          { label: "Open roles", value: "2", change: "Needs volunteers", icon: "☐" },
          { label: "Areas covered", value: "4", change: "Foyer, hall, stage, dining", icon: "◈" },
          { label: "Total shifts", value: "TBC", change: "After venue confirm", icon: "◷" },
        ]}
      />

      <DataTable
        title="Volunteer roster"
        description="Roles, availability, and assigned areas"
        columns={["name", "role", "availability", "status", "area"]}
        rows={PLACEHOLDER_VOLUNTEERS}
      />
    </>
  );
}
