import { DashboardShell, PlaceholderPanel } from "@/components/dashboard/DashboardShell";

export default function DashboardAnalyticsPage() {
  return (
    <DashboardShell
      title="Analytics"
      description="Traffic, conversion, and RSVP funnel metrics will connect in Phase 3."
    >
      <PlaceholderPanel
        title="Metrics (placeholder)"
        items={[
          { label: "Site visits (7d)", value: "—" },
          { label: "Register Interest clicks", value: "—" },
          { label: "Form completions", value: "—" },
          { label: "Sponsor page views", value: "—" },
        ]}
      />
    </DashboardShell>
  );
}
