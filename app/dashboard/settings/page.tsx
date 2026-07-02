import {
  DashboardCard,
  IntegrationBanner,
  IntegrationStatus,
  StatGrid,
} from "@/components/dashboard/dashboard-ui";
import { SITE } from "@/lib/site";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import { getSmsEnvPresence } from "@/platform/engines/notifications/sms/twilio-stub";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";

export default function DashboardSettingsPage() {
  const supabase = getSupabaseEnvPresence();
  const email = getEmailEnvPresence();
  const sms = getSmsEnvPresence();

  return (
    <>
      <IntegrationBanner title="Platform configuration" variant="info">
        {/* TODO(platform-settings): Persist settings in platform_settings table after auth. */}
        Event slug: <code>yoruba-day-canberra-2026</code> — override with{" "}
        <code>EVENT_SLUG</code> for future multi-event deployments.
      </IntegrationBanner>

      <StatGrid
        columns={2}
        stats={[
          { label: "Organisation", value: "YAC", change: SITE.presenter, icon: "◈" },
          { label: "Platform version", value: "v1.0", change: "Promax Event Platform", icon: "⚙" },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Event configuration" description="Active deployment settings">
          <dl className="space-y-4 font-sans text-sm">
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Event name</dt>
              <dd className="font-medium text-mahogany">{SITE.name}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Location</dt>
              <dd className="font-medium text-mahogany">{SITE.location}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <dt className="shrink-0 text-mahogany/50">Contact email</dt>
              <dd
                className="min-w-0 break-all font-medium text-mahogany sm:max-w-[65%] sm:text-right"
                title="info@yorubadaycanberra.org"
              >
                info@yorubadaycanberra.org
              </dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Auth provider</dt>
              <dd className="font-medium text-mahogany/60">Not configured</dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard title="Integrations" description="Connection status (env-based)">
          <IntegrationStatus
            items={[
              {
                name: "Supabase (database)",
                status: supabase.allPresent ? "Configured" : "Missing vars",
                ok: supabase.allPresent,
                detail: supabase.allPresent ? "Env vars present" : "Add URL + keys",
              },
              {
                name: "Resend (email)",
                status: email.ready ? "Ready" : email.hasResendKey ? "Missing FROM" : "Not configured",
                ok: email.ready,
                detail: email.ready ? "Confirmation emails active" : "Add RESEND_API_KEY",
              },
              {
                name: "Twilio (SMS)",
                status: sms.ready ? "Ready" : "Not configured",
                ok: sms.ready,
                detail: "Future — see docs/SMS.md",
              },
              {
                name: "Vercel (hosting)",
                status: "Deployment ready",
                ok: true,
                detail: "Connect repo in Vercel dashboard",
              },
              {
                name: "Authentication",
                status: "Not configured",
                ok: false,
                detail: "Supabase Auth — Phase 2",
              },
            ]}
          />
        </DashboardCard>
      </div>

      <DashboardCard title="Demo & launch notes" description="Important before public access">
        <ul className="space-y-3 font-sans text-sm leading-relaxed text-mahogany/65">
          <li>
            · This portal is currently in <strong>demo mode</strong> for committee and client
            presentations.
          </li>
          <li>
            · <strong>Authentication must be added</strong> before removing demo labels or sharing
            publicly.
          </li>
          <li>
            · Live RSVP data will appear after Supabase migration and protected server-side queries.
          </li>
          <li>· See <code className="text-xs">docs/PLATFORM.md</code> for the SaaS roadmap.</li>
        </ul>
      </DashboardCard>
    </>
  );
}
