import { DataTable, IntegrationBanner, StatGrid } from "@/components/dashboard/dashboard-ui";
import { PLACEHOLDER_TASKS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardTasksPage() {
  return (
    <>
      <IntegrationBanner title="Committee task board — demo" variant="info">
        {/* TODO(committee-crm): Sync with tasks table and assignee notifications. */}
        Progress indicators and priorities shown for planning demos.
      </IntegrationBanner>

      <StatGrid
        stats={[
          { label: "Total tasks", value: "12", change: "5 active", icon: "☑" },
          { label: "High priority", value: "3", change: "Needs attention", trend: "up", icon: "!" },
          { label: "Blocked", value: "1", change: "Catering vendor", icon: "⊘" },
          { label: "Completed", value: "8", change: "This quarter", icon: "✓" },
        ]}
      />

      <DataTable
        title="Committee tasks"
        description="Owners, priorities, and progress across workstreams"
        columns={["task", "owner", "due", "priority", "status", "progress"]}
        rows={PLACEHOLDER_TASKS}
      />
    </>
  );
}
