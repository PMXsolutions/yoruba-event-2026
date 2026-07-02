import {
  DashboardShell,
  DataTable,
  IntegrationBanner,
  StatGrid,
} from "@/components/dashboard/DashboardShell";
import {
  EXECUTIVE_STATS,
  PLACEHOLDER_TASKS,
} from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Executive dashboard"
      description="At-a-glance view of registrations, partnerships, volunteers, and committee progress."
    >
      <IntegrationBanner title="Integration status" variant="warning">
        {/* TODO(platform-auth): Protect /dashboard with Supabase Auth + RBAC before production use. */}
        Authentication is not yet enabled. Connect Supabase migration and Resend to activate live
        data and confirmation emails. See <code className="text-xs">docs/PLATFORM.md</code>.
      </IntegrationBanner>

      <StatGrid stats={EXECUTIVE_STATS} />

      <DataTable
        title="Priority committee tasks"
        columns={["task", "owner", "due", "status"]}
        rows={PLACEHOLDER_TASKS}
        emptyMessage="TODO(phase-2): Sync with task engine and assignee notifications."
      />
    </DashboardShell>
  );
}
