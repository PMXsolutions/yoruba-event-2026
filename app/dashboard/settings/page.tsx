import {
  DashboardShell,
  IntegrationBanner,
  StatGrid,
} from "@/components/dashboard/DashboardShell";
import { SITE } from "@/lib/site";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { getAuthUser } from "@/lib/auth/rbac";

export default async function DashboardSettingsPage() {
  const supabase = getSupabaseEnvPresence();
  const email = getEmailEnvPresence();
  const user = await getAuthUser();

  return (
    <DashboardShell
      title="Settings"
      description="Organisation profile, integrations, and platform configuration."
    >
      <IntegrationBanner title="Platform configuration">
        Event slug: <code className="text-xs">yoruba-day-canberra-2026</code> (override with{" "}
        <code className="text-xs">EVENT_SLUG</code> for future multi-event deployments).
      </IntegrationBanner>

      <StatGrid
        stats={[
          { label: "Organisation", value: SITE.presenter },
          { label: "Contact email", value: SITE.organisation ? "info@yorubadaycanberra.org" : "—" },
          { label: "Auth", value: user ? `${user.role}` : "Not signed in" },
          { label: "Platform", value: "Promax v1" },
        ]}
      />

      <section className="rounded-2xl border border-mahogany/8 bg-white p-6 shadow-[var(--shadow-card-light)] sm:p-8">
        <h2 className="font-display text-xl font-semibold text-mahogany">Integrations</h2>
        <dl className="mt-6 space-y-4 font-sans text-sm">
          <div className="flex justify-between border-b border-mahogany/8 pb-3">
            <dt className="text-mahogany/60">Supabase</dt>
            <dd className="font-semibold text-mahogany">
              {supabase.allPresent ? "Configured" : "Missing env vars"}
            </dd>
          </div>
          <div className="flex justify-between border-b border-mahogany/8 pb-3">
            <dt className="text-mahogany/60">SMTP (email)</dt>
            <dd className="font-semibold text-mahogany">
              {email.ready ? "Ready" : "Configure SMTP_* and MAIL_FROM"}
            </dd>
          </div>
          <div className="flex justify-between pb-1">
            <dt className="text-mahogany/60">Supabase Auth</dt>
            <dd className="font-semibold text-mahogany">
              {supabase.hasAnonKey ? "Enabled" : "Missing anon key"}
            </dd>
          </div>
        </dl>
      </section>
    </DashboardShell>
  );
}
