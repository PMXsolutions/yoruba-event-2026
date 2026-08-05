"use client";

import { useMemo, useState, useTransition } from "react";
import {
  updateSponsorNotesAction,
  updateSponsorStatusAction,
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
  formatSponsorStatus,
  type SponsorRecord,
  type SponsorStatus,
  SPONSOR_STATUSES,
} from "@/platform/engines/sponsors/schema";

type StatusFilter = "all" | SponsorStatus;

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

export function SponsorManagementPanel({
  records,
  error,
}: {
  records: SponsorRecord[];
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionError, setActionError] = useState<string | null>(error ?? null);
  const [noteTarget, setNoteTarget] = useState<SponsorRecord | null>(null);
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.companyName.toLowerCase().includes(q) ||
        r.contactPerson.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.package.toLowerCase().includes(q)
      );
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    const by = (s: SponsorStatus) => records.filter((r) => r.status === s).length;
    return [
      { label: "Total", value: String(records.length), icon: "★" },
      { label: "New", value: String(by("new")), icon: "◆" },
      { label: "Contacted", value: String(by("contacted")), icon: "☎" },
      { label: "Approved", value: String(by("approved") + by("active")), icon: "✓" },
    ];
  }, [records]);

  function handleExport() {
    const header = [
      "Company",
      "Contact",
      "Email",
      "Phone",
      "Package",
      "Status",
      "Notes",
      "Submitted",
    ];
    const rows = filtered.map((r) => [
      r.companyName,
      r.contactPerson,
      r.email,
      r.phone ?? "",
      r.package,
      formatSponsorStatus(r.status),
      r.committeeNotes ?? "",
      formatDateShort(r.createdAt),
    ]);
    downloadCsvFile(
      `yoruba-day-sponsors-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows],
    );
  }

  function runStatus(id: string, status: SponsorStatus) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateSponsorStatusAction(id, status);
      if (!result.ok) setActionError(result.error ?? "Could not update status.");
    });
  }

  function saveNotes() {
    if (!noteTarget) return;
    setActionError(null);
    startTransition(async () => {
      const result = await updateSponsorNotesAction(noteTarget.id, note);
      if (!result.ok) setActionError(result.error ?? "Could not save notes.");
      else setNoteTarget(null);
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
            title="Sponsor pipeline"
            description="Partnership enquiries, follow-ups, and package assignments"
          />
          <div className="mt-4">
            <PageToolbar>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company, contact, email…"
                aria-label="Search sponsors"
                className="w-full min-w-0 basis-full rounded-lg border border-mahogany/10 bg-cream/30 px-3 py-2 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10 sm:basis-auto sm:min-w-[12rem] sm:flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="rounded-lg border border-mahogany/10 bg-white px-3 py-2 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10"
              >
                <option value="all">All statuses</option>
                {SPONSOR_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatSponsorStatus(s)}
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
            title={records.length === 0 ? "No sponsors have been registered yet." : "No matching sponsors"}
            message={
              records.length === 0
                ? "Sponsor enquiries from the public site will appear here for committee follow-up."
                : "Try adjusting your search or filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-mahogany/[0.05] bg-cream/40">
                  {["Company", "Contact", "Package", "Status", "Submitted", "Notes", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-5 py-3.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-mahogany/45 sm:px-6"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-mahogany/[0.04]">
                {filtered.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-cream/30">
                    <td className="max-w-[12rem] px-5 py-4 font-medium text-mahogany sm:px-6">
                      <span className="block truncate">{r.companyName}</span>
                      <span className="block truncate text-xs text-mahogany/50">{r.email}</span>
                    </td>
                    <td className="px-5 py-4 text-mahogany/75 sm:px-6">{r.contactPerson}</td>
                    <td className="px-5 py-4 text-mahogany/75 sm:px-6">{r.package}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <StatusBadge status={formatSponsorStatus(r.status)} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-mahogany/65 sm:px-6">
                      {formatDateShort(r.createdAt)}
                    </td>
                    <td className="max-w-[10rem] px-5 py-4 sm:px-6">
                      <span className="block truncate text-mahogany/60" title={r.committeeNotes ?? undefined}>
                        {r.committeeNotes ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={r.status}
                          disabled={isPending}
                          aria-label={`Status for ${r.companyName}`}
                          onChange={(e) => runStatus(r.id, e.target.value as SponsorStatus)}
                          className="rounded-lg border border-mahogany/10 bg-white px-2 py-1.5 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35"
                        >
                          {SPONSOR_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {formatSponsorStatus(s)}
                            </option>
                          ))}
                        </select>
                        <ToolbarButton
                          onClick={() => {
                            setNoteTarget(r);
                            setNote(r.committeeNotes ?? "");
                          }}
                        >
                          Notes
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

      {noteTarget ? (
        <ModalShell title="Committee Notes" showTitle onClose={() => setNoteTarget(null)}>
          <p className="mt-1 truncate font-sans text-sm text-mahogany/55">
            {noteTarget.companyName} · {noteTarget.contactPerson}
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            maxLength={4000}
            aria-label="Committee notes"
            className="mt-4 w-full resize-y rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-3 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
          />
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ToolbarButton onClick={() => setNoteTarget(null)}>Cancel</ToolbarButton>
            <ToolbarButton primary disabled={isPending} onClick={saveNotes}>
              {isPending ? "Saving…" : "Save"}
            </ToolbarButton>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
