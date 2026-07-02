import { DashboardCard, DataTable, IntegrationBanner } from "@/components/dashboard/dashboard-ui";
import { PLACEHOLDER_ANNOUNCEMENTS } from "@/platform/engines/dashboard/placeholder-data";
import { AI_CAPABILITIES } from "@/platform/engines/ai/capabilities";

export default function DashboardAnnouncementsPage() {
  return (
    <>
      <IntegrationBanner title="Communications hub — demo" variant="info">
        {/* TODO(notification-engine): Wire publish workflow for email, web, and social channels. */}
        WhatsApp, email, and social placeholders shown for stakeholder preview.
      </IntegrationBanner>

      <DataTable
        title="Announcement queue"
        description="Draft and scheduled communications across channels"
        columns={["title", "channel", "status", "date"]}
        rows={PLACEHOLDER_ANNOUNCEMENTS}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {[
          { channel: "Email update", desc: "Sponsor deck announcement to mailing list", status: "Draft" },
          { channel: "WhatsApp update", desc: "Community group — Register Interest reminder", status: "Planned" },
          { channel: "Social media post", desc: "Programme reveal teaser — Instagram & Facebook", status: "Draft" },
        ].map((card) => (
          <DashboardCard key={card.channel} title={card.channel}>
            <p className="font-sans text-sm text-mahogany/65">{card.desc}</p>
            <p className="mt-3 font-sans text-xs font-semibold uppercase tracking-wide text-gold-deep">
              {card.status}
            </p>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard title="AI drafting capabilities (planned)" description="Promax AI Engine — not active in v1">
        <ul className="mt-2 grid gap-2 sm:grid-cols-2 font-sans text-sm text-mahogany/65">
          {AI_CAPABILITIES.filter(
            (c) => c.id.includes("announcement") || c.id.includes("social"),
          ).map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-lg bg-cream/40 px-3 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {c.name}
            </li>
          ))}
        </ul>
      </DashboardCard>
    </>
  );
}
