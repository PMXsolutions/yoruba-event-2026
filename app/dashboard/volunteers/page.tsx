import { DashboardShell, PlaceholderPanel } from "@/components/dashboard/DashboardShell";

export default function DashboardVolunteersPage() {
  return (
    <DashboardShell
      title="Volunteers"
      description="Coordinate volunteer roles, shifts, and contact details in Phase 2."
    >
      <PlaceholderPanel
        title="Volunteer roster"
        items={[
          { label: "Registered volunteers", value: "—" },
          { label: "Roles filled", value: "—" },
          { label: "Shifts scheduled", value: "—" },
          { label: "Pending approvals", value: "—" },
        ]}
      />
    </DashboardShell>
  );
}
