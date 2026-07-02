import { fetchPublishedAnnouncements } from "@/lib/data/public-content";

export async function AnnouncementsBanner() {
  const announcements = await fetchPublishedAnnouncements();
  if (announcements.length === 0) return null;

  const latest = announcements[0];

  return (
    <div
      role="status"
      className="relative border-b border-gold/15 bg-gradient-to-r from-mahogany via-espresso to-mahogany"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-8 lg:px-10">
        <span className="shrink-0 font-sans text-[0.62rem] font-bold uppercase tracking-[0.28em] text-gold-bright">
          Announcement
        </span>
        <p className="font-sans text-sm text-cream/85">
          <strong className="font-semibold text-cream">{latest.title}</strong>
          <span className="mx-2 text-gold-muted/60" aria-hidden>
            ·
          </span>
          <span className="text-cream/70">{latest.content}</span>
        </p>
      </div>
    </div>
  );
}
