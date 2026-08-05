import { EmptyState, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { TaskManagementPanel } from "@/components/dashboard/TaskManagementPanel";
import { fetchTasks } from "@/platform/engines/tasks/queries";
import { requireDashboardPage } from "@/lib/auth/page-gate";

export const dynamic = "force-dynamic";

export default async function DashboardTasksPage() {
  await requireDashboardPage("task.read");
  const result = await fetchTasks();

  if (!result.ok) {
    return (
      <>
        <IntegrationBanner title="Unable to load tasks" variant="warning">
          {result.message}
        </IntegrationBanner>
        <EmptyState
          title="Task data unavailable"
          message="Connect Supabase to load the committee task board."
        />
      </>
    );
  }

  return <TaskManagementPanel records={result.records} />;
}
