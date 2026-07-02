import {
  DataTable,
  IntegrationBanner,
  PageToolbar,
  ToolbarButton,
  ToolbarSearch,
} from "@/components/dashboard/dashboard-ui";
import { PLACEHOLDER_RSVPS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardRsvpsPage() {
  return (
    <>
      <IntegrationBanner title="RSVP Engine — demo data" variant="info">
        {/* TODO(rsvp-engine): Replace placeholder rows with authenticated Supabase queries. */}
        Showing sample records for presentation. Live data connects after migration and auth. No
        secrets are exposed in this view.
      </IntegrationBanner>

      <DataTable
        title="Interest registrations"
        description="Manage Register Interest submissions from the public site"
        columns={["name", "email", "guests", "ticket", "date", "status"]}
        rows={PLACEHOLDER_RSVPS}
        emptyMessage="Live Supabase data will replace placeholder rows once migration and auth are configured."
        toolbar={
          <PageToolbar>
            <ToolbarSearch placeholder="Search by name or email…" />
            <ToolbarButton disabled>Filter</ToolbarButton>
            <ToolbarButton disabled>Export CSV</ToolbarButton>
          </PageToolbar>
        }
      />
    </>
  );
}
