import { DashboardCard, DataTable, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { PLACEHOLDER_PROGRAMME } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardProgrammePage() {
  return (
    <>
      <IntegrationBanner title="Programme engine — draft run of show" variant="info">
        {/* TODO(programme-engine): Publish approved programme to public site when ready. */}
        Timings are placeholders until venue and acts are confirmed by the committee.
      </IntegrationBanner>

      <DataTable
        title="Run of show"
        description="Draft event programme — times, segments, and zone assignments"
        columns={["time", "segment", "owner", "zone", "status"]}
        rows={PLACEHOLDER_PROGRAMME}
      />

      <DashboardCard title="Programme notes" description="Committee guidance">
        <ul className="space-y-2 font-sans text-sm leading-relaxed text-mahogany/65">
          <li>· Opening ceremony must allow 20 minutes for elder blessings</li>
          <li>· Talking drum segment requires sound check 30 minutes prior</li>
          <li>· Cuisine service aligned with cultural showcase — not concurrent with Eyo preview</li>
        </ul>
      </DashboardCard>
    </>
  );
}
