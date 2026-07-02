import {
  DashboardShell,
  DataTable,
  IntegrationBanner,
} from "@/components/dashboard/DashboardShell";
import { PLACEHOLDER_PROGRAMME } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardProgrammePage() {
  return (
    <DashboardShell
      title="Programme management"
      description="Build and publish the run of show — times, acts, zones, and MC cues."
    >
      <IntegrationBanner title="Programme Engine">
        {/* TODO(programme-engine): programme_items table + public schedule page generator. */}
        Sample run-of-show below. Final programme requires committee approval and confirmed venue
        timings.
      </IntegrationBanner>

      <DataTable
        title="Run of show (draft)"
        columns={["time", "item", "lead", "zone"]}
        rows={PLACEHOLDER_PROGRAMME}
      />
    </DashboardShell>
  );
}
