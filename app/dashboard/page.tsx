import {
  DashboardShell,
  DataTable,
  StatGrid,
} from "@/components/dashboard/DashboardShell";
import { fetchDashboardStats, fetchRecentActivity } from "@/lib/data/public-content";
import { getAuthUser } from "@/lib/auth/rbac";

export default async function DashboardPage() {
  const [stats, activity, user] = await Promise.all([
    fetchDashboardStats(),
    fetchRecentActivity(8),
    getAuthUser(),
  ]);

  return (
    <DashboardShell
      title="Executive dashboard"
      description={`Welcome${user?.fullName ? `, ${user.fullName}` : ""}. At-a-glance view of registrations, partnerships, volunteers, and committee progress.`}
    >
      <StatGrid
        stats={[
          { label: "Total RSVPs", value: String(stats.totalRsvps), change: `${stats.todayRsvps} today` },
          { label: "Sponsors", value: String(stats.totalSponsors), change: `${stats.pendingSponsors} pending` },
          { label: "Volunteers", value: String(stats.totalVolunteers) },
          { label: "Announcements", value: String(stats.publishedAnnouncements), change: "Published" },
        ]}
      />

      <DataTable
        title="Recent activity"
        columns={["action", "entity_type", "created_at"]}
        rows={activity.map((a) => ({
          action: a.action,
          entity_type: a.entity_type ?? "—",
          created_at: new Date(a.created_at).toLocaleString("en-AU"),
        }))}
        emptyMessage="Activity will appear here as committee members take actions."
      />
    </DashboardShell>
  );
}
