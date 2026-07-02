import { DashboardShell, PlaceholderPanel } from "@/components/dashboard/DashboardShell";

export default function DashboardSponsorsPage() {
  return (
    <DashboardShell
      title="Sponsor pipeline"
      description="Track sponsor tiers, enquiries, and deck distribution after packages are finalised."
    >
      <PlaceholderPanel
        title="Sponsor tiers"
        items={[
          { label: "Platinum Patron", value: "0 confirmed" },
          { label: "Gold Circle", value: "0 confirmed" },
          { label: "Heritage Partner", value: "0 confirmed" },
          { label: "Community Ally", value: "0 confirmed" },
        ]}
      />
    </DashboardShell>
  );
}
