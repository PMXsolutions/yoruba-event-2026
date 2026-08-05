import { EmptyState, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { AnnouncementManagementPanel } from "@/components/dashboard/AnnouncementManagementPanel";
import { fetchAnnouncements } from "@/platform/engines/announcements/queries";
import { requireDashboardPage } from "@/lib/auth/page-gate";

export const dynamic = "force-dynamic";

export default async function DashboardAnnouncementsPage() {
  await requireDashboardPage("announcement.read");
  const result = await fetchAnnouncements();

  if (!result.ok) {
    return (
      <>
        <IntegrationBanner title="Unable to load announcements" variant="warning">
          {result.message}
        </IntegrationBanner>
        <EmptyState
          title="Announcement data unavailable"
          message="Connect Supabase to manage committee communications."
        />
      </>
    );
  }

  return <AnnouncementManagementPanel records={result.records} />;
}
