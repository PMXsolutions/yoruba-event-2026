import {
  DataTable,
  DashboardCard,
  IntegrationBanner,
  PipelineCards,
  StatGrid,
} from "@/components/dashboard/dashboard-ui";
import { PLACEHOLDER_SPONSORS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardSponsorsPage() {
  return (
    <>
      <IntegrationBanner title="Sponsor CRM — demo pipeline" variant="info">
        {/* TODO(sponsor-crm): Connect sponsor_enquiries table when business tiers are finalised. */}
        Tier names from event config. Deal values require committee approval before display.
      </IntegrationBanner>

      <StatGrid
        stats={[
          { label: "Active prospects", value: "3", change: "In pipeline", icon: "★" },
          { label: "Tiers available", value: "4", change: "Packages TBC", icon: "◆" },
          { label: "Follow-ups due", value: "3", change: "This fortnight", icon: "◷" },
          { label: "Confirmed", value: "0", change: "Awaiting packages", icon: "✓" },
        ]}
      />

      <PipelineCards
        items={[
          { label: "Platinum Patron", count: 1, subtitle: "Prospect" },
          { label: "Gold Circle", count: 1, subtitle: "In discussion" },
          { label: "Heritage Partner", count: 1, subtitle: "Prospect" },
          { label: "Community Ally", count: 1, subtitle: "Available" },
        ]}
      />

      <DataTable
        title="Sponsor pipeline"
        description="Track enquiries, follow-ups, and tier assignments"
        columns={["name", "contact", "tier", "status", "followUp", "value"]}
        rows={PLACEHOLDER_SPONSORS}
      />

      <DashboardCard title="Next actions" description="Recommended follow-ups for partnerships team">
        <ul className="space-y-3 font-sans text-sm text-mahogany/70">
          <li className="flex gap-2 rounded-lg bg-cream/40 px-4 py-3">
            <span className="text-gold-deep">→</span>
            Send sponsor deck to Canberra Community Bank — Platinum tier
          </li>
          <li className="flex gap-2 rounded-lg bg-cream/40 px-4 py-3">
            <span className="text-gold-deep">→</span>
            Schedule call with Heritage Foods Co. — Gold Circle discussion
          </li>
        </ul>
      </DashboardCard>
    </>
  );
}
