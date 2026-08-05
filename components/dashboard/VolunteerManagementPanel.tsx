"use client";

import { useMemo, useState, useTransition } from "react";
import {
  updateVolunteerProfileAction,
  updateVolunteerStatusAction,
} from "@/app/actions/dashboard";
import {
  EmptyState,
  PageToolbar,
  SectionHeader,
  StatGrid,
  StatusBadge,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import { ModalShell } from "@/components/dashboard/ModalShell";
import { downloadCsvFile } from "@/lib/export/csv";
import {
  formatVolunteerStatus,
  type VolunteerRecord,
  type VolunteerStatus,
  VOLUNTEER_STATUSES,
} from "@/platform/engines/volunteers/schema";

type StatusFilter = "all" | VolunteerStatus;

function formatDateShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function VolunteerManagementPanel({
  records,
  error,
}: {
  records: VolunteerRecord[];
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionError, setActionError] = useState<string | null>(error ?? null);
  const [editTarget, setEditTarget] = useState<VolunteerRecord | null>(null);
  const [assignedRole, setAssignedRole] = useState("");
  const [committeeNotes, setCommitteeNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.areaOfInterest?.toLowerCase().includes(q) ?? false) ||
        (r.assignedRole?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    const by = (s: VolunteerStatus) => records.filter((r) => r.status === s).length;
    return [
      { label: "Total", value: String(records.length), icon: "◎" },
      { label: "New", value: String(by("new")), icon: "◆" },
      { label: "Approved", value: String(by("approved")), icon: "✓" },
      { label: "Assigned", value: String(by("assigned")), icon: "☑" },
    ];
  }, [records]);

  function handleExport() {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Area",
      "Role",
      "Availability",
      "Skills",
      "Status",
      "Notes",
      "Submitted",
    ];
    const rows = filtered.map((r) => [
      r.fullName,
      r.email,
      r.phone ?? "",
      r.areaOfInterest ?? "",
      r.assignedRole ?? "",
      r.availability ?? "",
      r.skills.join("; "),
      formatVolunteerStatus(r.status),
      r.committeeNotes ?? "",
      formatDateShort(r.createdAt),
    ]);
    downloadCsvFile(
      `yoruba-day-volunteers-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows],
    );
  }

  function runStatus(id: string, status: VolunteerStatus) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateVolunteerStatusAction(id, status);
      if (!result.ok) setActionError(result.error ?? "Could not update status.");
    });
  }

  function saveProfile() {
    if (!editTarget) return;
    setActionError(null);
    startTransition(async () => {
      const result = await updateVolunteerProfileAction(
        editTarget.id,
        assignedRole,
        committeeNotes,
      );
      if (!result.ok) setActionError(result.error ?? "Could not save profile.");
      else setEditTarget(null);
    });
  }

  return (
    <div className="space-y-6">
      <StatGrid stats={stats} />

      {actionError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 font-sans text-sm text-red-900"
        >
          {actionError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-mahogany/[0.06] bg-white shadow-[0_1px_2px_rgba(36,21,15,0.04),0_8px_24px_-8px_rgba(36,21,15,0.08)]">
        <div className="border-b border-mahogany/[0.05] px-5 py-4 sm:px-6">
          <SectionHeader
            title="Volunteer roster"
            description="Registrations, assignments, and committee notes"
          />
          <div className="mt-4">
            <PageToolbar>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role…"
                aria-label="Search volunteers"
                className="w-full min-w-0 basis-full rounded-lg border border-mahogany/10 bg-cream/30 px-3 py-2 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10 sm:basis-auto sm:min-w-[12rem] sm:flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="rounded-lg border border-mahogany/10 bg-white px-3 py-2 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10"
              >
                <option value="all">All statuses</option>
                {VOLUNTEER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatVolunteerStatus(s)}
                  </option>
                ))}
              </select>
              <ToolbarButton onClick={handleExport} disabled={filtered.length === 0}>
                Export CSV
              </ToolbarButton>
            </PageToolbar>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={records.length === 0 ? "No volunteers have registered yet." : "No matching volunteers"}
            message={
              records.length === 0
                ? "Volunteer sign-ups from the public site will appear here."
                : "Try adjusting your search or filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-mahogany/[0.05] bg-cream/40">
                  {["Name", "Area", "Role", "Status", "Submitted", "Actions"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-5 py-3.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-mahogany/45 sm:px-6"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mahogany/[0.04]">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-cream/30">
                    <td className="max-w-[12rem] px-5 py-4 font-medium text-mahogany sm:px-6">
                      <span className="block truncate">{r.fullName}</span>
                      <span className="block truncate text-xs text-mahogany/50">{r.email}</span>
                    </td>
                    <td className="px-5 py-4 text-mahogany/75 sm:px-6">
                      {r.areaOfInterest ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-mahogany/75 sm:px-6">
                      {r.assignedRole ?? "—"}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <StatusBadge status={formatVolunteerStatus(r.status)} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-mahogany/65 sm:px-6">
                      {formatDateShort(r.createdAt)}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={r.status}
                          disabled={isPending}
                          aria-label={`Status for ${r.fullName}`}
                          onChange={(e) => runStatus(r.id, e.target.value as VolunteerStatus)}
                          className="rounded-lg border border-mahogany/10 bg-white px-2 py-1.5 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35"
                        >
                          {VOLUNTEER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {formatVolunteerStatus(s)}
                            </option>
                          ))}
                        </select>
                        <ToolbarButton
                          onClick={() => {
                            setEditTarget(r);
                            setAssignedRole(r.assignedRole ?? "");
                            setCommitteeNotes(r.committeeNotes ?? "");
                          }}
                        >
                          Edit
                        </ToolbarButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editTarget ? (
        <ModalShell title="Volunteer assignment" showTitle onClose={() => setEditTarget(null)}>
          <p className="mt-1 truncate font-sans text-sm text-mahogany/55">
            {editTarget.fullName} · {editTarget.email}
          </p>
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
            Assigned role
            <input
              value={assignedRole}
              onChange={(e) => setAssignedRole(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
            />
          </label>
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
            Committee notes
            <textarea
              value={committeeNotes}
              onChange={(e) => setCommitteeNotes(e.target.value)}
              rows={4}
              maxLength={4000}
              className="mt-1.5 w-full resize-y rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-3 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
            />
          </label>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ToolbarButton onClick={() => setEditTarget(null)}>Cancel</ToolbarButton>
            <ToolbarButton primary disabled={isPending} onClick={saveProfile}>
              {isPending ? "Saving…" : "Save"}
            </ToolbarButton>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
