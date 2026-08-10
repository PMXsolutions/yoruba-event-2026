import {
  DashboardCard,
  IntegrationStatus,
  StatGrid,
} from "@/components/dashboard/dashboard-ui";
import { getAuthUser } from "@/lib/auth/rbac";
import { SITE } from "@/lib/site";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getFeatureFlags } from "@/platform/core/flags";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import { EMAIL_TEMPLATE_CATALOG } from "@/platform/engines/notifications/email/templates/catalog";
import { getSmsEnvPresence } from "@/platform/engines/notifications/sms/twilio-stub";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const event = getActiveEventConfig();
  const supabase = getSupabaseEnvPresence();
  const email = getEmailEnvPresence();
  const sms = getSmsEnvPresence();
  const flags = getFeatureFlags();
  const admin = await getAuthUser();
  const version = typeof packageJson.version === "string" ? packageJson.version : "1.0.0";
  const platformName =
    typeof packageJson.name === "string" ? packageJson.name : "promax-event-platform";
  const smsActive = flags.smsEnabled && sms.ready;

  return (
    <>
      <StatGrid
        columns={2}
        stats={[
          {
            label: "Organisation",
            value: SITE.organisation,
            change: SITE.presenter,
            icon: "◈",
          },
          {
            label: "Platform version",
            value: version,
            change: platformName,
            icon: "⚙",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Event configuration" description="Active deployment settings">
          <dl className="space-y-4 font-sans text-sm">
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Event name</dt>
              <dd className="font-medium text-mahogany">{event.name}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Slug</dt>
              <dd className="font-medium text-mahogany">{event.slug}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Date</dt>
              <dd className="font-medium text-mahogany">{event.heroDateDisplay}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Location</dt>
              <dd className="font-medium text-mahogany">{event.location}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <dt className="shrink-0 text-mahogany/50">Contact email</dt>
              <dd
                className="min-w-0 break-all font-medium text-mahogany sm:max-w-[65%] sm:text-right"
                title={event.contact.email}
              >
                {event.contact.email}
              </dd>
            </div>
          </dl>
        </DashboardCard>

        <DashboardCard title="Integrations" description="Connection status (env presence only)">
          <IntegrationStatus
            items={[
              {
                name: "Supabase (database)",
                status: supabase.serviceRoleReady ? "Configured" : "Not configured",
                ok: supabase.serviceRoleReady,
                detail: supabase.serviceRoleReady
                  ? "Service-role database access ready"
                  : "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
              },
              {
                name: "Supabase Auth",
                status: supabase.authReady ? "Configured" : "Not configured",
                ok: supabase.authReady,
                detail: supabase.authReady
                  ? "Browser auth (anon key) ready"
                  : "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
              },
              {
                name: "Email (SMTP / Resend)",
                status: email.ready ? "Configured" : "Not configured",
                ok: email.ready,
                detail: email.ready
                  ? email.transport === "smtp"
                    ? "SMTP transport ready"
                    : "Resend transport ready"
                  : "Email transport environment variables are incomplete",
              },
              {
                name: "Twilio (SMS)",
                status: smsActive
                  ? "Enabled"
                  : sms.ready
                    ? "Configured (flag off)"
                    : "Not configured",
                ok: smsActive,
                detail: smsActive
                  ? "SMS confirmations active when consent is given"
                  : flags.smsEnabled
                    ? "SMS_ENABLED is on but Twilio credentials are incomplete"
                    : "Set SMS_ENABLED=true and Twilio credentials to activate",
              },
            ]}
          />
        </DashboardCard>
      </div>

      <DashboardCard title="Feature flags" description="Controlled public launch switches">
        <dl className="grid gap-3 font-sans text-sm sm:grid-cols-2">
          {(
            [
              ["PUBLIC_REGISTRATION_OPEN", flags.publicRegistrationOpen],
              ["EMAIL_CONFIRMATIONS_ENABLED", flags.emailConfirmationsEnabled],
              ["SMS_ENABLED", flags.smsEnabled],
              ["DASHBOARD_AUTH_REQUIRED", flags.dashboardAuthRequired],
            ] as const
          ).map(([name, on]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-xl border border-mahogany/[0.06] bg-cream/40 px-4 py-3"
            >
              <dt className="font-mono text-xs text-mahogany/60">{name}</dt>
              <dd className={`font-semibold ${on ? "text-emerald-800" : "text-mahogany/50"}`}>
                {on ? "true" : "false"}
              </dd>
            </div>
          ))}
        </dl>
      </DashboardCard>

      <DashboardCard
        title="Email templates"
        description="Reusable communication templates — only Register Interest Confirmation is auto-active"
      >
        <ul className="space-y-2 font-sans text-sm text-mahogany/70">
          {EMAIL_TEMPLATE_CATALOG.map((t) => (
            <li
              key={t.id}
              className="flex flex-col gap-0.5 border-b border-mahogany/[0.05] py-2 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="font-medium text-mahogany">{t.name}</span>
              <span className="text-xs uppercase tracking-wide text-mahogany/45">
                {t.autoActive ? "Auto-active" : "Template only"}
              </span>
            </li>
          ))}
        </ul>
      </DashboardCard>

      <DashboardCard title="Current admin" description="Signed-in committee account">
        {admin ? (
          <dl className="space-y-4 font-sans text-sm">
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Name</dt>
              <dd className="font-medium text-mahogany">{admin.fullName || "—"}</dd>
            </div>
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Email</dt>
              <dd className="font-medium text-mahogany">{admin.email}</dd>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
              <dt className="text-mahogany/50">Role</dt>
              <dd className="font-medium text-mahogany">{admin.role.replaceAll("_", " ")}</dd>
            </div>
          </dl>
        ) : (
          <p className="font-sans text-sm text-mahogany/60">No signed-in admin session.</p>
        )}
      </DashboardCard>
    </>
  );
}
