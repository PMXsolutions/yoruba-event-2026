import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { RsvpManagement } from "@/components/dashboard/RsvpManagement";
import { fetchAllRsvps } from "@/lib/data/public-content";

export default async function DashboardRsvpsPage() {
  const rsvps = await fetchAllRsvps();

  return (
    <DashboardShell
      title="RSVP management"
      description="Search, filter, export, and manage attendee registrations."
    >
      <RsvpManagement initialRsvps={rsvps} />
    </DashboardShell>
  );
}
