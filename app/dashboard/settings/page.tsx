import {
  DashboardShell,
  IntegrationBanner,
  StatGrid,
} from "@/components/dashboard/DashboardShell";
import { SITE } from "@/lib/site";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import { getSmsEnvPresence } from "@/platform/engines/notifications/sms/twilio-stub";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";

export default function DashboardSettingsPage() {
  const supabase = getSupabaseEnvPresence();
  const email = getEmailEnvPresence();
  const sms = getSmsEnvPresence();

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
          { label: "Contact email", value: "info@yorubadaycanberra.org" },
          { label: "Auth provider", value: "Not configured" },
          { label: "Platform", value: "Promax v1" },
        ]}
      />

      <section className="rounded-2xl border border-mahogany/8 bg-white p-6 shadow-[var(--shadow-card-light)] sm:p-8">
        <h2 className="font-display text-xl font-semibold text-mahogany">Integrations</h2>
        <dl className="mt-6 space-y-4 font-sans text-sm">
          <div className="flex justify-between border-b border-mahogany/8 pb-3">
            <dt className="text-mahogany/60">Supabase</dt>
            <dd className="font-semibold text-mahogany">
              {supabase.allPresent ? "Env configured" : "Missing env vars"}
            </dd>
          </div>
          <div className="flex justify-between border-b border-mahogany/8 pb-3">
            <dt className="text-mahogany/60">Resend (email)</dt>
            <dd className="font-semibold text-mahogany">
              {email.ready ? "Ready" : email.hasResendKey ? "Missing FROM email" : "Add API key"}
            </dd>
          </div>
          <div className="flex justify-between pb-1">
            <dt className="text-mahogany/60">Twilio (SMS)</dt>
            <dd className="font-semibold text-mahogany">
              {sms.ready ? "Ready" : "Not configured"}
            </dd>
          </div>
        </dl>
        <p className="mt-6 font-sans text-xs leading-relaxed text-mahogany/50">
          {/* TODO(platform-settings): Persist org settings in platform_settings table. */}
          Integration status is read from environment variables only. See docs/EMAIL.md and
          docs/SMS.md.
        </p>
      </section>
    </DashboardShell>
  );
}
