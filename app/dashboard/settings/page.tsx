import {
  DashboardCard,
  IntegrationStatus,
  StatGrid,
} from "@/components/dashboard/dashboard-ui";
import { getAuthUser } from "@/lib/auth/rbac";
import { SITE } from "@/lib/site";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import { getEmailEnvPresence } from "@/platform/engines/notifications/email/env-status";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";

export default async function DashboardSettingsPage() {
  const event = getActiveEventConfig();
  const supabase = getSupabaseEnvPresence();
  const email = getEmailEnvPresence();
  const admin = await getAuthUser();
  const version = typeof packageJson.version === "string" ? packageJson.version : "1.0.0";
  const platformName =
    typeof packageJson.name === "string" ? packageJson.name : "promax-event-platform";

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
                status: supabase.allPresent ? "Configured" : "Not configured",
                ok: supabase.allPresent,
                detail: supabase.allPresent
                  ? "Environment variables present"
                  : "Required database environment variables are missing",
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
