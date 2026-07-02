import {
  ActivityFeed,
  BarChart,
  DashboardCard,
  DataTable,
  IntegrationBanner,
  MilestoneList,
  StatGrid,
  TrendChart,
} from "@/components/dashboard/dashboard-ui";
import {
  EXECUTIVE_STATS,
  FUNNEL_CHART,
  PLACEHOLDER_TASKS,
  RECENT_ACTIVITY,
  TREND_POINTS,
  UPCOMING_MILESTONES,
} from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardPage() {
  return (
    <>
      <IntegrationBanner title="Demo mode — committee portal" variant="warning">
        {/* TODO(platform-auth): Protect /dashboard with Supabase Auth + RBAC before public launch. */}
        Authentication is not yet enabled. Placeholder data is shown for stakeholder demos. Connect
        Supabase migration and Resend to activate live metrics.
      </IntegrationBanner>

      <StatGrid stats={EXECUTIVE_STATS} columns={6} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BarChart
              title="Registration funnel"
              subtitle="Preview data — live metrics after Supabase migration"
              data={[...FUNNEL_CHART]}
            />
            <TrendChart
              title="Site traffic trend"
              subtitle="Last 7 days (placeholder)"
              points={[...TREND_POINTS]}
            />
          </div>

          <DataTable
            title="Priority committee tasks"
            description="Active workstreams requiring committee attention"
            columns={["task", "owner", "due", "priority", "status", "progress"]}
            rows={PLACEHOLDER_TASKS}
          />
        </div>

        <div className="space-y-6">
          <DashboardCard title="Recent activity" description="Latest portal events">
            <ActivityFeed items={RECENT_ACTIVITY} />
          </DashboardCard>

          <DashboardCard title="Upcoming milestones" description="Key dates on the planning horizon">
            <MilestoneList items={UPCOMING_MILESTONES} />
          </DashboardCard>
        </div>
      </div>
    </>
  );
}
