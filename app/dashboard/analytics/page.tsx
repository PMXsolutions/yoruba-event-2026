import {
  DashboardShell,
  IntegrationBanner,
  StatGrid,
} from "@/components/dashboard/DashboardShell";
import { PLACEHOLDER_ANALYTICS } from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardAnalyticsPage() {
  return (
    <DashboardShell
      title="Analytics"
      description="Traffic, conversion, and engagement metrics across the public site and RSVP funnel."
    >
      <IntegrationBanner title="Analytics Engine">
        {/* TODO(analytics-engine): Plausible or GA4 integration + RSVP funnel events. */}
        Connect Plausible, Vercel Analytics, or GA4 in Phase 3. Event tracking hooks will live in
        platform/engines/analytics/.
      </IntegrationBanner>

      <StatGrid stats={PLACEHOLDER_ANALYTICS} />
    </DashboardShell>
  );
}
