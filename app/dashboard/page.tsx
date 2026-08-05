import {
  ActivityFeed,
  BarChart,
  DashboardCard,
  DataTable,
  EmptyState,
  IntegrationBanner,
  MilestoneList,
  StatGrid,
  TrendChart,
} from "@/components/dashboard/dashboard-ui";
import { fetchExecutiveDashboard } from "@/platform/engines/dashboard/overview";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await fetchExecutiveDashboard();

  return (
    <>
      {data.error ? (
        <IntegrationBanner title="Unable to load live metrics" variant="warning">
          {data.error}
        </IntegrationBanner>
      ) : null}

      <StatGrid stats={data.stats} columns={6} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BarChart
              title="Registration funnel"
              subtitle="Live RSVP status breakdown"
              data={data.funnel}
            />
            <TrendChart
              title="RSVP trend"
              subtitle="Registrations over the last 14 days"
              points={data.trend}
            />
          </div>

          {data.openTasks.length === 0 ? (
            <DashboardCard title="Priority committee tasks" description="Active workstreams">
              <EmptyState
                title="No open tasks"
                message="Create tasks from the Tasks module to track committee workstreams."
              />
            </DashboardCard>
          ) : (
            <DataTable
              title="Priority committee tasks"
              description="Active workstreams requiring committee attention"
              columns={["task", "owner", "due", "priority", "status", "progress"]}
              rows={data.openTasks}
            />
          )}
        </div>

        <div className="space-y-6">
          <DashboardCard title="Recent activity" description="Latest portal events">
            {data.activity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                message="Committee actions and registrations will appear here as they happen."
              />
            ) : (
              <ActivityFeed items={data.activity} />
            )}
          </DashboardCard>

          <DashboardCard title="Upcoming milestones" description="Key dates on the planning horizon">
            <MilestoneList items={data.milestones} />
          </DashboardCard>
        </div>
      </div>
    </>
  );
}
