"use client";

import { useMemo, useState, useTransition } from "react";
import {
  toggleRsvpTagAction,
  updateRsvpCommitteeNoteAction,
  updateRsvpStatusAction,
} from "@/app/actions/dashboard-rsvp";
import {
  EmptyState,
  PageToolbar,
  SectionHeader,
  StatGrid,
  StatusBadge,
  TagBadge,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import { TICKET_TYPES } from "@/lib/site";
import {
  type DashboardRsvpRecord,
  type RsvpDataSource,
  type RsvpStatus,
  type RsvpTag,
  RSVP_QUICK_TAGS,
  RSVP_STATUSES,
  RSVP_TAGS,
  computeRsvpKpis,
  formatRsvpDate,
  formatRsvpDateShort,
  formatRsvpStatusLabel,
} from "@/platform/engines/dashboard/rsvp/types";

type StatusFilter = "all" | RsvpStatus;
type TagFilter = "all" | RsvpTag;

type RsvpManagementPanelProps = {
  records: DashboardRsvpRecord[];
  source: RsvpDataSource;
};

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
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

function RsvpStatusBanner({ source }: { source: RsvpDataSource }) {
  if (source === "live") {
    return (
      <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 shadow-sm">
        <p className="font-sans text-sm font-semibold text-emerald-950">Live RSVP Data</p>
        <p className="mt-1 font-sans text-sm leading-relaxed text-emerald-900/85">
          This dashboard is connected to the live Register Interest database.
        </p>
        {/* TODO(platform-auth): Protect /dashboard/rsvps with Supabase Auth before public launch. */}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-sky-200/70 bg-gradient-to-r from-sky-50 to-white px-5 py-4 shadow-sm">
      <p className="font-sans text-sm font-semibold text-sky-950">Demo Mode</p>
      <p className="mt-1 font-sans text-sm leading-relaxed text-sky-900/85">
        This dashboard is currently showing sample data. Live registrations will appear here once
        the Supabase migration is applied.
      </p>
    </section>
  );
}

function MenuItem({
  label,
  disabled,
  onClick,
  muted,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`block w-full px-4 py-2 text-left font-sans text-sm transition-colors hover:bg-cream/60 disabled:cursor-not-allowed disabled:opacity-40 ${
        muted ? "text-mahogany/45" : "text-mahogany/80"
      }`}
    >
      {label}
    </button>
  );
}

function ActionMenu({
  record,
  disabled,
  onView,
  onEditNote,
  onStatusChange,
  onTagToggle,
}: {
  record: DashboardRsvpRecord;
  disabled: boolean;
  onView: (r: DashboardRsvpRecord) => void;
  onEditNote: (r: DashboardRsvpRecord) => void;
  onStatusChange: (id: string, status: RsvpStatus) => void;
  onTagToggle: (id: string, tag: RsvpTag) => void;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

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
        Actions <span aria-hidden className="text-mahogany/40">▾</span>
      </button>
      {open ? (
        <>
          <button type="button" className="fixed inset-0 z-10" aria-label="Close menu" onClick={close} />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 max-h-[24rem] w-52 overflow-y-auto rounded-xl border border-mahogany/[0.08] bg-white py-1 shadow-lg"
          >
            <MenuItem label="View Details" onClick={() => { onView(record); close(); }} />
            <MenuItem label="Edit RSVP" disabled muted />
            <MenuItem
              label={record.committeeNotes ? "Edit Committee Note" : "Add Committee Note"}
              disabled={disabled}
              onClick={() => { onEditNote(record); close(); }}
            />
            <div className="my-1 border-t border-mahogany/[0.06]" />
            {RSVP_STATUSES.map((s) => (
              <MenuItem
                key={s}
                label={`Mark as ${formatRsvpStatusLabel(s)}`}
                disabled={disabled || record.status === s}
                onClick={() => { onStatusChange(record.id, s); close(); }}
              />
            ))}
            <div className="my-1 border-t border-mahogany/[0.06]" />
            {RSVP_QUICK_TAGS.map((tag) => (
              <MenuItem
                key={tag}
                label={record.tags.includes(tag) ? `Remove ${tag} tag` : `Tag as ${tag}`}
                disabled={disabled}
                onClick={() => { onTagToggle(record.id, tag); close(); }}
              />
            ))}
            <div className="my-1 border-t border-mahogany/[0.06]" />
            <MenuItem label="Send email — coming soon" disabled muted />
            <MenuItem label="Send SMS — coming soon" disabled muted />
          </div>
        </>
      ) : null}
    </div>
  );
}

function CommitteeNoteDialog({
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
  const [note, setNote] = useState(record.committeeNotes ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-mahogany/[0.08] bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-mahogany">Committee Notes</h3>
        <p className="mt-1 truncate font-sans text-sm text-mahogany/55">
          {record.fullName} · {record.email}
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder="Follow-up outcomes, seating preferences, sponsor conversations…"
          className="mt-4 w-full resize-y rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-3 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
        />
        <p className="mt-2 font-sans text-xs text-mahogany/45">{note.length} / 4,000</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <ToolbarButton onClick={onClose}>Cancel</ToolbarButton>
          <ToolbarButton primary disabled={saving} onClick={() => onSave(record.id, note)}>
            {saving ? "Saving…" : "Save"}
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}

function RegisterGuestDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-mahogany/[0.08] bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold text-mahogany">Register Guest</h3>
        <p className="mt-3 font-sans text-sm leading-relaxed text-mahogany/65">
          Manual phone and walk-in registrations will be added here. Committee members will be able
          to create attendee records directly from the dashboard.
        </p>
        <p className="mt-2 font-sans text-xs font-semibold uppercase tracking-wide text-gold-muted">
          Coming soon
        </p>
        <div className="mt-5 flex justify-end">
          <ToolbarButton primary onClick={onClose}>Close</ToolbarButton>
        </div>
      </div>
    </div>
  );
}

function RsvpDetailModal({
  record,
  onClose,
  onEditNote,
}: {
  record: DashboardRsvpRecord;
  onClose: () => void;
  onEditNote: (r: DashboardRsvpRecord) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-espresso/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden border-l border-mahogany/[0.08] bg-white shadow-2xl sm:max-w-lg">
        <div className="border-b border-mahogany/[0.06] px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-xl font-semibold text-mahogany">{record.fullName}</h3>
              <p className="mt-1 truncate font-sans text-sm text-mahogany/55">{record.email}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-mahogany/10 px-2.5 py-1.5 font-sans text-xs font-semibold text-mahogany/60 hover:bg-cream/60"
            >
              Close
            </button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge status={formatRsvpStatusLabel(record.status)} />
            {record.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <dl className="space-y-4 font-sans text-sm">
            {[
              ["Phone", record.phone ?? "—"],
              ["Guests", String(record.numberOfAttendees)],
              ["Ticket preference", record.ticketType ?? "—"],
              ["Submitted", formatRsvpDate(record.createdAt)],
              ["Contacted", record.contactedAt ? formatRsvpDate(record.contactedAt) : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-3">
                <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/40">{label}</dt>
                <dd className="break-words text-mahogany/80">{value}</dd>
              </div>
            ))}
            <div className="flex flex-col gap-1 border-b border-mahogany/[0.05] pb-3">
              <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/40">Registrant message</dt>
              <dd className="break-words text-mahogany/70">{record.notes ?? "—"}</dd>
            </div>
            <div className="flex flex-col gap-1 pb-3">
              <dt className="text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/40">Committee Notes</dt>
              <dd className="break-words text-mahogany/70">{record.committeeNotes ?? "—"}</dd>
              <button
                type="button"
                onClick={() => { onClose(); onEditNote(record); }}
                className="mt-1 w-fit font-sans text-xs font-semibold text-gold-deep hover:text-mahogany"
              >
                {record.committeeNotes ? "Edit note" : "Add note"}
              </button>
            </div>
          </dl>

          <div className="mt-6 rounded-xl border border-mahogany/[0.06] bg-cream/30 p-4">
            <p className="font-sans text-[0.65rem] font-bold uppercase tracking-wide text-mahogany/40">
              Activity timeline
            </p>
            <ul className="mt-3 space-y-3 font-sans text-sm text-mahogany/65">
              <li className="flex gap-2">
                <span className="text-gold-deep">·</span>
                Registered interest — {formatRsvpDateShort(record.createdAt)}
              </li>
              {record.contactedAt ? (
                <li className="flex gap-2">
                  <span className="text-gold-deep">·</span>
                  Marked contacted — {formatRsvpDateShort(record.contactedAt)}
                </li>
              ) : null}
              <li className="flex gap-2 text-mahogany/45">
                <span>·</span>
                Ticket invitation, payment, and check-in events will appear here in a future release.
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function RsvpManagementPanel({ records, source }: RsvpManagementPanelProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ticketFilter, setTicketFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<TagFilter>("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<DashboardRsvpRecord | null>(null);
  const [detailTarget, setDetailTarget] = useState<DashboardRsvpRecord | null>(null);
  const [registerGuestOpen, setRegisterGuestOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isDemo = source === "demo";

  const kpis = useMemo(() => computeRsvpKpis(records), [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (ticketFilter !== "all" && r.ticketType !== ticketFilter) return false;
      if (tagFilter !== "all" && !r.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.phone?.toLowerCase().includes(q) ?? false) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [records, search, statusFilter, ticketFilter, tagFilter]);

  function handleExport() {
    const header = [
      "Name", "Email", "Phone", "Guests", "Ticket", "Status", "Tags",
      "Contacted at", "Committee Notes", "Registrant message", "Submitted",
    ];
    const rows = filtered.map((r) => [
      r.fullName, r.email, r.phone ?? "", String(r.numberOfAttendees), r.ticketType ?? "",
      formatRsvpStatusLabel(r.status), r.tags.join("; "),
      r.contactedAt ? formatRsvpDate(r.contactedAt) : "",
      r.committeeNotes ?? "", r.notes ?? "", formatRsvpDate(r.createdAt),
    ]);
    downloadCsv(`yoruba-day-rsvps-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows]);
  }

  function runAction(fn: () => Promise<{ ok: boolean; error?: string }>) {
    if (isDemo) return;
    setActionError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) setActionError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="space-y-6">
      <RsvpStatusBanner source={source} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <ToolbarButton primary onClick={() => setRegisterGuestOpen(true)}>
          + Register Guest
        </ToolbarButton>
      </div>

      <StatGrid
        columns={6}
        stats={[
          { label: "Total Registrations", value: String(kpis.totalRegistrations), icon: "✉" },
          { label: "New Today", value: String(kpis.newToday), icon: "◷" },
          { label: "Contacted", value: String(kpis.contacted), icon: "☎" },
          { label: "Confirmed", value: String(kpis.confirmed), icon: "✓" },
          { label: "Expected Guests", value: String(kpis.expectedGuests), icon: "◎" },
          { label: "Pending Follow Up", value: String(kpis.pendingFollowUp), icon: "→" },
        ]}
      />

      {actionError ? (
        <div role="alert" className="rounded-xl border border-red-200/70 bg-red-50 px-4 py-3 font-sans text-sm text-red-900">
          {actionError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-mahogany/[0.06] bg-white shadow-[0_1px_2px_rgba(36,21,15,0.04),0_8px_24px_-8px_rgba(36,21,15,0.08)]">
        <div className="border-b border-mahogany/[0.05] px-5 py-4 sm:px-6">
          <SectionHeader
            title="Interest registrations"
            description="Relationship management for Register Interest submissions — follow up, segment, and prepare for ticketing."
          />
          <div className="mt-4">
            <PageToolbar>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, phone, or tag…"
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
                  <option key={s} value={s}>{formatRsvpStatusLabel(s)}</option>
                ))}
              </select>
              <select
                value={ticketFilter}
                onChange={(e) => setTicketFilter(e.target.value)}
                aria-label="Filter by ticket type"
                className="rounded-lg border border-mahogany/10 bg-white px-3 py-2 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10"
              >
                <option value="all">All tickets</option>
                {TICKET_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value as TagFilter)}
                aria-label="Filter by tag"
                className="rounded-lg border border-mahogany/10 bg-white px-3 py-2 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10"
              >
                <option value="all">All tags</option>
                {RSVP_TAGS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                disabled
                aria-label="Date range filter"
                title="Date range filtering — coming soon"
                className="cursor-not-allowed rounded-lg border border-mahogany/10 bg-cream/40 px-3 py-2 font-sans text-xs font-semibold text-mahogany/40 outline-none"
              >
                <option>Date range — soon</option>
              </select>
              <ToolbarButton onClick={handleExport} disabled={filtered.length === 0}>
                Export CSV
              </ToolbarButton>
            </PageToolbar>
          </div>
          <p className="mt-3 font-sans text-xs text-mahogany/45">
            Showing {filtered.length} of {records.length} registration{records.length === 1 ? "" : "s"}
            {isPending ? " · Saving…" : ""}
          </p>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={records.length === 0 ? "No registrations yet" : "No matching registrations"}
            message={
              records.length === 0
                ? "When guests submit Register Interest on the public site, their records will appear here for committee follow-up."
                : "Try adjusting your search or filters to find the registration you need."
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[64rem] text-left font-sans text-sm">
                <thead>
                  <tr className="border-b border-mahogany/[0.05] bg-cream/40">
                    {["Name", "Email", "Guests", "Ticket", "Tags", "Submitted", "Status", "Committee Notes", "Actions"].map((h) => (
                      <th key={h} scope="col" className="px-5 py-3.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-mahogany/45 sm:px-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-mahogany/[0.04]">
                  {filtered.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-cream/30">
                      <td className="max-w-[10rem] px-5 py-4 font-medium text-mahogany sm:px-6">
                        <button type="button" onClick={() => setDetailTarget(r)} className="block max-w-full truncate text-left hover:text-gold-deep">
                          {r.fullName}
                        </button>
                      </td>
                      <td className="max-w-[11rem] px-5 py-4 sm:px-6">
                        <span className="block truncate text-mahogany/75" title={r.email}>{r.email}</span>
                      </td>
                      <td className="px-5 py-4 text-mahogany/80 sm:px-6">{r.numberOfAttendees}</td>
                      <td className="max-w-[8rem] px-5 py-4 sm:px-6">
                        <span className="block truncate" title={r.ticketType ?? undefined}>{r.ticketType ?? "—"}</span>
                      </td>
                      <td className="max-w-[10rem] px-5 py-4 sm:px-6">
                        <div className="flex flex-wrap gap-1">
                          {r.tags.length > 0 ? r.tags.map((t) => <TagBadge key={t} tag={t} />) : <span className="text-mahogany/40">—</span>}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-mahogany/65 sm:px-6">{formatRsvpDateShort(r.createdAt)}</td>
                      <td className="px-5 py-4 sm:px-6"><StatusBadge status={formatRsvpStatusLabel(r.status)} /></td>
                      <td className="max-w-[11rem] px-5 py-4 sm:px-6">
                        <span className="block truncate text-mahogany/60" title={r.committeeNotes ?? undefined}>{r.committeeNotes ?? "—"}</span>
                      </td>
                      <td className="px-5 py-4 sm:px-6">
                        <ActionMenu
                          record={r}
                          disabled={isDemo || isPending}
                          onView={setDetailTarget}
                          onEditNote={setNoteTarget}
                          onStatusChange={(id, status) => runAction(() => updateRsvpStatusAction(id, status))}
                          onTagToggle={(id, tag) => runAction(() => toggleRsvpTagAction(id, tag))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 xl:hidden">
              {filtered.map((r) => (
                <article key={r.id} className="rounded-xl border border-mahogany/[0.06] bg-cream/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" onClick={() => setDetailTarget(r)} className="min-w-0 text-left">
                      <p className="truncate font-sans text-sm font-semibold text-mahogany">{r.fullName}</p>
                      <p className="truncate font-sans text-xs text-mahogany/55">{r.email}</p>
                    </button>
                    <StatusBadge status={formatRsvpStatusLabel(r.status)} />
                  </div>
                  {r.tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">{r.tags.map((t) => <TagBadge key={t} tag={t} />)}</div>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-2 gap-2 font-sans text-xs">
                    <div><dt className="text-mahogany/40">Guests</dt><dd>{r.numberOfAttendees}</dd></div>
                    <div><dt className="text-mahogany/40">Ticket</dt><dd className="truncate">{r.ticketType ?? "—"}</dd></div>
                    <div className="col-span-2"><dt className="text-mahogany/40">Submitted</dt><dd>{formatRsvpDateShort(r.createdAt)}</dd></div>
                    {r.committeeNotes ? (
                      <div className="col-span-2"><dt className="text-mahogany/40">Committee Notes</dt><dd className="text-mahogany/65">{r.committeeNotes}</dd></div>
                    ) : null}
                  </dl>
                  <div className="mt-4">
                    <ActionMenu
                      record={r}
                      disabled={isDemo || isPending}
                      onView={setDetailTarget}
                      onEditNote={setNoteTarget}
                      onStatusChange={(id, status) => runAction(() => updateRsvpStatusAction(id, status))}
                      onTagToggle={(id, tag) => runAction(() => toggleRsvpTagAction(id, tag))}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {noteTarget ? (
        <CommitteeNoteDialog
          record={noteTarget}
          saving={isPending}
          onClose={() => setNoteTarget(null)}
          onSave={(id, note) => {
            if (isDemo) return;
            setActionError(null);
            startTransition(async () => {
              const result = await updateRsvpCommitteeNoteAction(id, note);
              if (!result.ok) setActionError(result.error);
              else setNoteTarget(null);
            });
          }}
        />
      ) : null}

      {detailTarget ? (
        <RsvpDetailModal
          record={detailTarget}
          onClose={() => setDetailTarget(null)}
          onEditNote={setNoteTarget}
        />
      ) : null}

      {registerGuestOpen ? <RegisterGuestDialog onClose={() => setRegisterGuestOpen(false)} /> : null}
    </div>
  );
}
