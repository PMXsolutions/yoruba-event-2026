"use client";

import { useState, useTransition } from "react";
import { updateProfileRoleAction } from "@/app/actions/dashboard";
import { DashboardCard, ToolbarButton } from "@/components/dashboard/dashboard-ui";
import {
  PLATFORM_ROLES,
  formatRoleLabel,
  type PlatformRole,
} from "@/lib/auth/permissions";

type ProfileRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: PlatformRole;
  isActive: boolean;
};

export function UserManagementPanel({
  profiles,
  currentUserId,
}: {
  profiles: ProfileRow[];
  currentUserId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(profile: ProfileRow, role: PlatformRole, isActive: boolean) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await updateProfileRoleAction(profile.id, { role, isActive });
      if (!res.ok) setError(res.error ?? "Could not update user.");
      else setInfo(`Updated ${profile.email}.`);
    });
  }

  return (
    <DashboardCard
      title="Committee users"
      description="Promote roles for signed-up accounts. New sign-ups default to Read Only until promoted."
    >
      {error ? (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {info ? (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {info}
        </p>
      ) : null}
      {profiles.length === 0 ? (
        <p className="font-sans text-sm text-mahogany/60">No profiles found.</p>
      ) : (
        <ul className="space-y-4">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-mahogany/[0.06] bg-cream/30 p-4 font-sans text-sm"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-semibold text-mahogany">{p.fullName || p.email}</p>
                  <p className="text-mahogany/55">{p.email}</p>
                  {p.id === currentUserId ? (
                    <p className="mt-1 text-xs text-gold-deep">You</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    defaultValue={p.role}
                    id={`role-${p.id}`}
                    aria-label={`Role for ${p.email}`}
                    className="rounded-lg border border-mahogany/10 bg-white px-3 py-2 text-xs font-semibold"
                    disabled={isPending || p.id === currentUserId}
                  >
                    {PLATFORM_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {formatRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-xs text-mahogany/70">
                    <input
                      type="checkbox"
                      defaultChecked={p.isActive}
                      id={`active-${p.id}`}
                      disabled={isPending || p.id === currentUserId}
                    />
                    Active
                  </label>
                  <ToolbarButton
                    disabled={isPending || p.id === currentUserId}
                    onClick={() => {
                      const roleEl = document.getElementById(`role-${p.id}`) as HTMLSelectElement | null;
                      const activeEl = document.getElementById(
                        `active-${p.id}`,
                      ) as HTMLInputElement | null;
                      if (!roleEl || !activeEl) return;
                      save(p, roleEl.value as PlatformRole, activeEl.checked);
                    }}
                  >
                    Save
                  </ToolbarButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
