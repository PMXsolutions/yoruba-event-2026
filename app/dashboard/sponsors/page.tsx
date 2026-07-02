import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SponsorManagement } from "@/components/dashboard/SponsorManagement";
import { fetchAllSponsors } from "@/lib/data/public-content";

export default async function DashboardSponsorsPage() {
  const sponsors = await fetchAllSponsors();

  return (
    <DashboardShell
      title="Sponsor management"
      description="Review applications, approve partners, and export sponsor data."
    >
      <SponsorManagement initialSponsors={sponsors} />
    </DashboardShell>
  );
}
