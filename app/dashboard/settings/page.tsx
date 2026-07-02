import { DashboardShell, PlaceholderPanel } from "@/components/dashboard/DashboardShell";

export default function DashboardSettingsPage() {
  return (
    <DashboardShell
      title="Settings"
      description="Organisation profile, notification preferences, and integration keys (server-side only)."
    >
      <PlaceholderPanel
        title="Configuration"
        items={[
          { label: "Organisation", value: "Yoruba Association Canberra" },
          { label: "Public email", value: "info@yorubadaycanberra.org" },
          { label: "Auth provider", value: "Not configured" },
          { label: "Email notifications", value: "Disabled" },
        ]}
      />
    </DashboardShell>
  );
}
