import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { AnnouncementForm } from "@/components/dashboard/AnnouncementForm";
import { fetchAllAnnouncements } from "@/lib/data/public-content";

export default async function DashboardAnnouncementsPage() {
  const announcements = await fetchAllAnnouncements();

  return (
    <DashboardShell
      title="Announcements"
      description="Publish updates visible on the homepage banner."
    >
      <AnnouncementForm />
      <div className="space-y-4">
        {announcements.map((a) => (
          <article key={a.id} className="rounded-2xl border border-mahogany/8 bg-white p-5 shadow-[var(--shadow-card-light)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-mahogany">{a.title}</h3>
                <p className="mt-2 font-sans text-sm text-mahogany/70">{a.content}</p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs font-bold uppercase ${
                a.is_published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
              }`}>
                {a.is_published ? "Published" : "Draft"}
              </span>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}
