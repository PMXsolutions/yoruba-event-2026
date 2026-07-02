import {
  BarChart,
  DashboardCard,
  IntegrationBanner,
  StatGrid,
  TrendChart,
} from "@/components/dashboard/dashboard-ui";
import {
  ATTENDANCE_BREAKDOWN,
  FUNNEL_CHART,
  PLACEHOLDER_ANALYTICS,
  SPONSOR_PIPELINE_CHART,
  TREND_POINTS,
} from "@/platform/engines/dashboard/placeholder-data";

export default function DashboardAnalyticsPage() {
  return (
    <>
      <IntegrationBanner title="Analytics engine — preview metrics" variant="info">
        {/* TODO(analytics-engine): Connect Plausible, Vercel Analytics, or GA4. */}
        Placeholder metrics for demo. Live funnel data requires analytics integration.
      </IntegrationBanner>

      <StatGrid stats={PLACEHOLDER_ANALYTICS} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart title="Registration trend" subtitle="Weekly interest (placeholder)" points={[...TREND_POINTS]} />
        <BarChart title="Conversion funnel" subtitle="Visit → click → complete" data={[...FUNNEL_CHART]} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart
          title="Attendance breakdown"
          subtitle="By ticket preference (placeholder %)"
          data={ATTENDANCE_BREAKDOWN.map((d) => ({ ...d, value: d.value * 10 }))}
        />
        <BarChart
          title="Sponsor pipeline"
          subtitle="Prospects by tier"
          data={SPONSOR_PIPELINE_CHART.map((d) => ({ label: d.label, value: d.value * 25 }))}
        />
      </div>

      <DashboardCard title="Conversion metrics" description="Key performance indicators">
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Visit → RSVP click", value: "14.9%" },
            { label: "Click → form start", value: "50.5%" },
            { label: "Form start → complete", value: "0% (awaiting DB)" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl border border-mahogany/[0.05] bg-cream/30 p-4">
              <dt className="font-sans text-xs text-mahogany/45">{m.label}</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-mahogany">{m.value}</dd>
            </div>
          ))}
        </dl>
      </DashboardCard>
    </>
  );
}
