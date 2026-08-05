import {
  BarChart,
  DashboardCard,
  EmptyState,
  IntegrationBanner,
  StatGrid,
  TrendChart,
} from "@/components/dashboard/dashboard-ui";
import { fetchAnalytics } from "@/platform/engines/dashboard/overview";

export const dynamic = "force-dynamic";

export default async function DashboardAnalyticsPage() {
  const data = await fetchAnalytics();

  if (data.error) {
    return (
      <>
        <IntegrationBanner title="Unable to load analytics" variant="warning">
          {data.error}
        </IntegrationBanner>
        <EmptyState
          title="Analytics unavailable"
          message="Connect Supabase to view live engagement metrics."
        />
      </>
    );
  }

  if (data.empty) {
    return (
      <EmptyState
        title="No analytics data yet"
        message="Charts will appear once RSVPs, sponsors, or volunteers are recorded for this event."
      />
    );
  }

  return (
    <>
      <StatGrid
        stats={[
          { label: "RSVPs", value: String(data.rsvpCount), icon: "✉" },
          { label: "Expected attendees", value: String(data.attendeeTotal), icon: "◎" },
          { label: "Sponsors", value: String(data.sponsorCount), icon: "★" },
          { label: "Volunteers", value: String(data.volunteerCount), icon: "◎" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart
          title="RSVP trend"
          subtitle="Registrations over the last 30 days"
          points={data.rsvpsOverTime}
        />
        <BarChart
          title="Status breakdown"
          subtitle="Live RSVP statuses"
          data={data.statusBreakdown}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.ticketTypes.length > 0 ? (
          <BarChart
            title="Ticket preferences"
            subtitle="From Register Interest submissions"
            data={data.ticketTypes}
          />
        ) : (
          <DashboardCard title="Ticket preferences">
            <EmptyState
              title="No ticket data"
              message="Ticket preferences will appear once guests register interest."
            />
          </DashboardCard>
        )}
        {data.sponsorPackages.length > 0 ? (
          <BarChart
            title="Sponsor packages"
            subtitle="Enquiries by package"
            data={data.sponsorPackages}
          />
        ) : (
          <DashboardCard title="Sponsor packages">
            <EmptyState
              title="No sponsor data"
              message="Package breakdown will appear once sponsors register."
            />
          </DashboardCard>
        )}
      </div>
    </>
  );
}
