import { DashboardShell, PlaceholderPanel } from "@/components/dashboard/DashboardShell";

const PLACEHOLDER_RSVPS = [
  { label: "Latest registration", value: "Placeholder" },
  { label: "Total count", value: "—" },
  { label: "This week", value: "—" },
  { label: "Export", value: "Not available" },
];

export default function DashboardRsvpsPage() {
  return (
    <DashboardShell
      title="RSVP management"
      description="View, filter, and export interest registrations once auth and Supabase read access are wired."
    >
      <PlaceholderPanel title="RSVP queue" items={PLACEHOLDER_RSVPS} />
    </DashboardShell>
  );
}
