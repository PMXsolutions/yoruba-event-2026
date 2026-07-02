"use client";

import { useMemo, useState, useTransition } from "react";
import {
  updateRsvpInternalNoteAction,
  updateRsvpStatusAction,
} from "@/app/actions/dashboard-rsvp";
import {
  EmptyState,
  IntegrationBanner,
  PageToolbar,
  SectionHeader,
  StatusBadge,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import {
  type DashboardRsvpRecord,
  type RsvpDataSource,
  type RsvpStatus,
  RSVP_STATUSES,
  formatRsvpDate,
  formatRsvpStatusLabel,
} from "@/platform/engines/dashboard/rsvp/types";

type StatusFilter = "all" | RsvpStatus;

type RsvpManagementPanelProps = {
  records: DashboardRsvpRecord[];
  source: RsvpDataSource;
  fallbackMessage?: string;
};

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ActionMenu({
  record,
  disabled,
  onStatusChange,
  onEditNote,
}: {
  record: DashboardRsvpRecord;
  disabled: boolean;
  onStatusChange: (id: string, status: RsvpStatus) => void;
  onEditNote: (record: DashboardRsvpRecord) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-mahogany/10 bg-white px-3 py-1.5 font-sans text-xs font-semibold text-mahogany/75 transition-colors hover:border-gold/25 hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-45"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        Actions
        <span aria-hidden className="text-mahogany/40">
          ▾
        </span>
      </button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="Close actions menu"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 min-w-[11rem] overflow-hidden rounded-xl border border-mahogany/[0.08] bg-white py-1 shadow-lg"
          >
            {RSVP_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                role="menuitem"
                disabled={disabled || record.status === status}
                onClick={() => {
                  onStatusChange(record.id, status);
                  setOpen(false);
                }}
                className="block w-full px-4 py-2 text-left font-sans text-sm text-mahogany/80 transition-colors hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Mark as {formatRsvpStatusLabel(status)}
              </button>
            ))}
            <div className="my-1 border-t border-mahogany/[0.06]" />
            <button
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                onEditNote(record);
                setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left font-sans text-sm text-mahogany/80 transition-colors hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {record.internalNotes ? "Edit internal note" : "Add internal note"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function NoteDialog({
  record,
  onClose,
  onSave,
  saving,
}: {
  record: DashboardRsvpRecord;
  onClose: () => void;
  onSave: (id: string, note: string) => void;
  saving: boolean;
}) {
  const [note, setNote] = useState(record.internalNotes ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-espresso/40 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-mahogany/[0.08] bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-mahogany">Internal note</h3>
        <p className="mt-1 font-sans text-sm text-mahogany/55">
          {record.fullName} · <span className="truncate">{record.email}</span>
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder="Committee-only notes — follow-up details, call outcomes, seating preferences…"
          className="mt-4 w-full resize-y rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-3 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
        />
        <p className="mt-2 font-sans text-xs text-mahogany/45">{note.length} / 4000</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <ToolbarButton onClick={onClose}>Cancel</ToolbarButton>
          <ToolbarButton primary disabled={saving} onClick={() => onSave(record.id, note)}>
            {saving ? "Saving…" : "Save note"}
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}

export function RsvpManagementPanel({
  records,
  source,
  fallbackMessage,
}: RsvpManagementPanelProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<DashboardRsvpRecord | null>(null);
  const [isPending, startTransition] = useTransition();
  const isDemo = source === "demo";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [records, search, statusFilter]);

  function handleExport() {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Guests",
      "Ticket",
      "Status",
      "Contacted at",
      "Internal notes",
      "Registrant notes",
      "Submitted",
    ];
    const rows = filtered.map((r) => [
      r.fullName,
      r.email,
      r.phone ?? "",
      String(r.numberOfAttendees),
      r.ticketType ?? "",
      formatRsvpStatusLabel(r.status),
      r.contactedAt ? formatRsvpDate(r.contactedAt) : "",
      r.internalNotes ?? "",
      r.notes ?? "",
      formatRsvpDate(r.createdAt),
    ]);
    downloadCsv(`yoruba-day-rsvps-${new Date().toISOString().slice(0, 10)}.csv`, [
      header,
      ...rows,
    ]);
  }

  function handleStatusChange(id: string, status: RsvpStatus) {
    if (isDemo) return;
    setActionError(null);
    startTransition(async () => {
      const result = await updateRsvpStatusAction(id, status);
      if (!result.ok) setActionError(result.error);
    });
  }

  function handleSaveNote(id: string, note: string) {
    if (isDemo) return;
    setActionError(null);
    startTransition(async () => {
      const result = await updateRsvpInternalNoteAction(id, note);
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setNoteTarget(null);
    });
  }

  return (
    <>
      {isDemo ? (
        <IntegrationBanner title="RSVP Engine — demo fallback" variant="warning">
          {/* TODO(platform-auth): Protect /dashboard/rsvps with Supabase Auth before public launch. */}
          {fallbackMessage ??
            "Supabase is not connected or migrations are pending. Showing sample records."}
        </IntegrationBanner>
      ) : (
        <IntegrationBanner title="Live RSVP data" variant="success">
          {/* TODO(platform-auth): Protect /dashboard/rsvps with Supabase Auth + RBAC before public launch. */}
          Showing real submissions from Supabase. This route is not yet authenticated — do not
          share publicly.
        </IntegrationBanner>
      )}

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
            title="Interest registrations"
            description="Manage Register Interest submissions from the public site"
          />
          <div className="mt-4">
            <PageToolbar>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone…"
                aria-label="Search RSVPs"
                className="w-full min-w-0 basis-full rounded-lg border border-mahogany/10 bg-cream/30 px-3 py-2 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10 sm:basis-auto sm:min-w-[12rem] sm:flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="rounded-lg border border-mahogany/10 bg-white px-3 py-2 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10"
              >
                <option value="all">All statuses</option>
                {RSVP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatRsvpStatusLabel(s)}
                  </option>
                ))}
              </select>
              <ToolbarButton onClick={handleExport} disabled={filtered.length === 0}>
                Export CSV
              </ToolbarButton>
            </PageToolbar>
          </div>
          <p className="mt-3 font-sans text-xs text-mahogany/45">
            {filtered.length} of {records.length} record{records.length === 1 ? "" : "s"}
            {isPending ? " · Updating…" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={records.length === 0 ? "No registrations yet" : "No matching records"}
            message={
              records.length === 0
                ? "Submissions from the public Register Interest form will appear here."
                : "Try adjusting your search or status filter."
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[56rem] text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-mahogany/[0.05] bg-cream/40">
                    {[
                      "Name",
                      "Email",
                      "Guests",
                      "Ticket",
                      "Submitted",
                      "Status",
                      "Contacted",
                      "Internal note",
                      "Actions",
                    ].map((h) => (
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
                      <td className="max-w-[10rem] px-5 py-4 font-medium text-mahogany sm:px-6">
                        <span className="block truncate" title={r.fullName}>
                          {r.fullName}
                        </span>
                      </td>
                      <td className="max-w-[12rem] px-5 py-4 sm:px-6">
                        <span className="block truncate text-mahogany/75" title={r.email}>
                          {r.email}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-mahogany/80 sm:px-6">{r.numberOfAttendees}</td>
                      <td className="max-w-[9rem] px-5 py-4 sm:px-6">
                        <span className="block truncate" title={r.ticketType ?? undefined}>
                          {r.ticketType ?? "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-mahogany/65 sm:px-6">
                        {formatRsvpDate(r.createdAt)}
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <StatusBadge status={formatRsvpStatusLabel(r.status)} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-mahogany/65 sm:px-6">
                        {r.contactedAt ? formatRsvpDate(r.contactedAt) : "—"}
                      </td>
                      <td className="max-w-[12rem] px-5 py-4 sm:px-6">
                        <span
                          className="block truncate text-mahogany/60"
                          title={r.internalNotes ?? undefined}
                        >
                          {r.internalNotes ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <ActionMenu
                          record={r}
                          disabled={isDemo || isPending}
                          onStatusChange={handleStatusChange}
                          onEditNote={setNoteTarget}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {filtered.map((r) => (
                <article
                  key={r.id}
                  className="rounded-xl border border-mahogany/[0.06] bg-cream/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-sans text-sm font-semibold text-mahogany">
                        {r.fullName}
                      </p>
                      <p className="truncate font-sans text-xs text-mahogany/55">{r.email}</p>
                    </div>
                    <StatusBadge status={formatRsvpStatusLabel(r.status)} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-2 font-sans text-xs">
                    <div>
                      <dt className="text-mahogany/40">Guests</dt>
                      <dd className="text-mahogany/75">{r.numberOfAttendees}</dd>
                    </div>
                    <div>
                      <dt className="text-mahogany/40">Ticket</dt>
                      <dd className="truncate text-mahogany/75">{r.ticketType ?? "—"}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-mahogany/40">Submitted</dt>
                      <dd className="text-mahogany/75">{formatRsvpDate(r.createdAt)}</dd>
                    </div>
                    {r.internalNotes ? (
                      <div className="col-span-2">
                        <dt className="text-mahogany/40">Internal note</dt>
                        <dd className="text-mahogany/65">{r.internalNotes}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-4">
                    <ActionMenu
                      record={r}
                      disabled={isDemo || isPending}
                      onStatusChange={handleStatusChange}
                      onEditNote={setNoteTarget}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {noteTarget ? (
        <NoteDialog
          record={noteTarget}
          saving={isPending}
          onClose={() => setNoteTarget(null)}
          onSave={handleSaveNote}
        />
      ) : null}
    </>
  );
}
