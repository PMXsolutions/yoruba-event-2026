import { DashboardShell, PlaceholderPanel } from "@/components/dashboard/DashboardShell";

export default function DashboardTasksPage() {
  return (
    <DashboardShell
      title="Planning tasks"
      description="Committee task board for venue, programme, catering, and communications workstreams."
    >
      <PlaceholderPanel
        title="Task board summary"
        items={[
          { label: "To do", value: "12 (placeholder)" },
          { label: "In progress", value: "4 (placeholder)" },
          { label: "Blocked", value: "2 (placeholder)" },
          { label: "Done", value: "8 (placeholder)" },
        ]}
      />
    </DashboardShell>
  );
}
