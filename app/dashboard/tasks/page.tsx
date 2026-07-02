import {
  DashboardShell,
  DataTable,
  IntegrationBanner,
} from "@/components/dashboard/DashboardShell";
import { PLACEHOLDER_TASKS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardTasksPage() {
  return (
    <DashboardShell
      title="Committee tasks"
      description="Planning board for venue, programme, catering, and communications workstreams."
    >
      <IntegrationBanner title="Committee CRM">
        {/* TODO(committee-crm): tasks table with assignees, due dates, and Slack/email reminders. */}
        Task assignments will sync with committee roles once authentication is live.
      </IntegrationBanner>

      <DataTable
        title="Task board"
        columns={["task", "owner", "due", "status"]}
        rows={PLACEHOLDER_TASKS}
      />
    </DashboardShell>
  );
}
