import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { VolunteerManagement } from "@/components/dashboard/VolunteerManagement";
import { fetchAllVolunteers } from "@/lib/data/public-content";

export default async function DashboardVolunteersPage() {
  const volunteers = await fetchAllVolunteers();

  return (
    <DashboardShell
      title="Volunteer management"
      description="Review registrations, assign roles, and track availability."
    >
      <VolunteerManagement initialVolunteers={volunteers} />
    </DashboardShell>
  );
}
