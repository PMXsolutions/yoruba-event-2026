import {
  DashboardShell,
  DataTable,
  IntegrationBanner,
} from "@/components/dashboard/DashboardShell";
import { PLACEHOLDER_SPONSORS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardSponsorsPage() {
  return (
    <DashboardShell
      title="Sponsor CRM"
      description="Track sponsor tiers, enquiries, and partnership pipeline."
    >
      <IntegrationBanner title="Sponsor CRM Engine">
        {/* TODO(sponsor-crm): New table sponsor_enquiries + deal stages. */}
        Placeholder pipeline. Tier names come from event config; deal values require business
        approval.
      </IntegrationBanner>

      <DataTable
        title="Sponsor pipeline"
        columns={["tier", "status", "contact", "value"]}
        rows={PLACEHOLDER_SPONSORS}
      />
    </DashboardShell>
  );
}
