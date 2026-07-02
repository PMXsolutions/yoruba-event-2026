import {
  DashboardShell,
  DataTable,
  IntegrationBanner,
} from "@/components/dashboard/DashboardShell";
import { PLACEHOLDER_ANNOUNCEMENTS } from "@/platform/engines/dashboard/placeholder-data";
import { AI_CAPABILITIES } from "@/platform/engines/ai/capabilities";

export default function DashboardAnnouncementsPage() {
  return (
    <DashboardShell
      title="Announcements"
      description="Draft and publish updates to the website, email list, and social channels."
    >
      <IntegrationBanner title="Notification Engine">
        {/* TODO(notification-engine): announcements table + publish workflow. */}
        Email via Resend; SMS via Twilio (future). AI drafting available when AI engine is
        activated — see docs/AI.md.
      </IntegrationBanner>

      <DataTable
        title="Announcement queue"
        columns={["title", "status", "channel", "date"]}
        rows={PLACEHOLDER_ANNOUNCEMENTS}
      />

      <section className="rounded-2xl border border-mahogany/8 bg-white p-6 shadow-[var(--shadow-card-light)]">
        <h2 className="font-display text-xl font-semibold text-mahogany">AI drafting (planned)</h2>
        <ul className="mt-4 space-y-2 font-sans text-sm text-mahogany/75">
          {AI_CAPABILITIES.filter((c) => c.id.includes("announcement") || c.id.includes("social")).map(
            (c) => (
              <li key={c.id} className="flex gap-2">
                <span className="text-gold-deep">·</span>
                {c.name} — <span className="text-mahogany/50">{c.status}</span>
              </li>
            ),
          )}
        </ul>
      </section>
    </DashboardShell>
  );
}
