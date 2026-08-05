import {
  DashboardCard,
  IntegrationStatus,
  StatGrid,
} from "@/components/dashboard/dashboard-ui";
import { UserManagementPanel } from "@/components/dashboard/UserManagementPanel";
import { requireDashboardPage } from "@/lib/auth/page-gate";
import { hasPermission, listProfiles } from "@/lib/auth/rbac";
import { getFeatureFlags } from "@/lib/feature-flags";
import { SITE } from "@/lib/site";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const user = await requireDashboardPage("settings.read", "/dashboard/settings");
  const event = getActiveEventConfig();
  const supabase = getSupabaseEnvPresence();
  const email = getEmailEnvPresence();
  const flags = getFeatureFlags();
  const canManageUsers = hasPermission(user, "user.manage");
  const profiles = canManageUsers ? await listProfiles() : [];
  const version = typeof packageJson.version === "string" ? packageJson.version : "1.0.0";

  const flagRows = Object.entries(flags).map(([key, value]) => ({
    key,
    value: value ? "On" : "Off",
  }));

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
            change: SITE.name,
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
            ]}
          />
        </DashboardCard>
      </div>

      <DashboardCard
        title="Feature flags"
        description="Read-only snapshot from environment (safe defaults keep Register Interest open)"
      >
        <dl className="grid gap-3 sm:grid-cols-2">
          {flagRows.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between rounded-xl border border-mahogany/[0.06] bg-cream/40 px-4 py-3 font-sans text-sm"
            >
              <dt className="text-mahogany/60">{row.key}</dt>
              <dd className="font-semibold text-mahogany">{row.value}</dd>
            </div>
          ))}
        </dl>
      </DashboardCard>

      <DashboardCard title="Signed-in account" description="Your committee credentials">
        <dl className="space-y-4 font-sans text-sm">
          <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
            <dt className="text-mahogany/50">Name</dt>
            <dd className="font-medium text-mahogany">{user.fullName || "—"}</dd>
          </div>
          <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-4 sm:flex-row sm:justify-between">
            <dt className="text-mahogany/50">Email</dt>
            <dd className="font-medium text-mahogany">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
            <dt className="text-mahogany/50">Role</dt>
            <dd className="font-medium text-mahogany">{user.role.replaceAll("_", " ")}</dd>
          </div>
        </dl>
      </DashboardCard>

      {canManageUsers ? <UserManagementPanel profiles={profiles} currentUserId={user.id} /> : null}
    </>
  );
}
