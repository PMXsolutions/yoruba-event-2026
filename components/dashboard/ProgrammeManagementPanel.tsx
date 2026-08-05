"use client";

import { useMemo, useState, useTransition } from "react";
import {
  deleteProgrammeItemAction,
  saveProgrammeItemAction,
} from "@/app/actions/dashboard";
import {
  EmptyState,
  PageToolbar,
  SectionHeader,
  StatusBadge,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import { ModalShell } from "@/components/dashboard/ModalShell";
import type { ProgrammeItemRecord } from "@/platform/engines/programme/schema";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ProgrammeManagementPanel({
  records,
  error,
}: {
  records: ProgrammeItemRecord[];
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(error ?? null);
  const [editTarget, setEditTarget] = useState<ProgrammeItemRecord | null | "new">(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [category, setCategory] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [published, setPublished] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.speaker?.toLowerCase().includes(q) ?? false) ||
        (r.location?.toLowerCase().includes(q) ?? false) ||
        (r.category?.toLowerCase().includes(q) ?? false),
    );
  }, [records, search]);

  function openCreate() {
    setEditTarget("new");
    setTitle("");
    setDescription("");
    setStartTime("");
    setEndTime("");
    setLocation("");
    setSpeaker("");
    setCategory("");
    setDisplayOrder(String(records.length));
    setPublished(false);
  }

  function openEdit(r: ProgrammeItemRecord) {
    setEditTarget(r);
    setTitle(r.title);
    setDescription(r.description ?? "");
    setStartTime(toLocalInput(r.startTime));
    setEndTime(toLocalInput(r.endTime));
    setLocation(r.location ?? "");
    setSpeaker(r.speaker ?? "");
    setCategory(r.category ?? "");
    setDisplayOrder(String(r.displayOrder));
    setPublished(r.published);
  }

  function save() {
    setActionError(null);
    const id = editTarget && editTarget !== "new" ? editTarget.id : undefined;
    startTransition(async () => {
      const result = await saveProgrammeItemAction(
        {
          title,
          description: description || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          location: location || undefined,
          speaker: speaker || undefined,
          category: category || undefined,
          displayOrder: Number(displayOrder) || 0,
          published,
        },
        id,
      );
      if (!result.ok) setActionError(result.error ?? "Could not save programme item.");
      else setEditTarget(null);
    });
  }

  function remove(id: string) {
    if (!window.confirm("Delete this programme item?")) return;
    setActionError(null);
    startTransition(async () => {
      const result = await deleteProgrammeItemAction(id);
      if (!result.ok) setActionError(result.error ?? "Could not delete item.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ToolbarButton primary onClick={openCreate}>
          + Add segment
        </ToolbarButton>
      </div>

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
            title="Run of show"
            description="Event programme — times, segments, and publish state"
          />
          <div className="mt-4">
            <PageToolbar>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search programme…"
                aria-label="Search programme"
                className="w-full min-w-0 flex-1 rounded-lg border border-mahogany/10 bg-cream/30 px-3 py-2 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
              />
            </PageToolbar>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={records.length === 0 ? "No programme items yet" : "No matching items"}
            message={
              records.length === 0
                ? "Add segments to build the run of show for Yoruba Day."
                : "Try adjusting your search."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-mahogany/[0.05] bg-cream/40">
                  {["Order", "Segment", "Time", "Location", "Status", "Actions"].map((h) => (
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
                    <td className="px-5 py-4 text-mahogany/65 sm:px-6">{r.displayOrder}</td>
                    <td className="max-w-[16rem] px-5 py-4 sm:px-6">
                      <p className="font-medium text-mahogany">{r.title}</p>
                      {r.speaker ? (
                        <p className="text-xs text-mahogany/50">{r.speaker}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-mahogany/65 sm:px-6">
                      {formatDateTime(r.startTime)}
                    </td>
                    <td className="px-5 py-4 text-mahogany/75 sm:px-6">{r.location ?? "—"}</td>
                    <td className="px-5 py-4 sm:px-6">
                      <StatusBadge status={r.published ? "Published" : "Draft"} />
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex flex-wrap gap-2">
                        <ToolbarButton onClick={() => openEdit(r)}>Edit</ToolbarButton>
                        <ToolbarButton onClick={() => remove(r.id)}>Delete</ToolbarButton>
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
        <ModalShell
          title={editTarget === "new" ? "Add programme segment" : "Edit programme segment"}
          showTitle
          onClose={() => setEditTarget(null)}
        >
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
            />
          </label>
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-3 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              Start
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-3 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
              />
            </label>
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              End
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-3 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
              />
            </label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
              />
            </label>
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              Speaker
              <input
                value={speaker}
                onChange={(e) => setSpeaker(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
              />
            </label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              Category
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
              />
            </label>
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              Display order
              <input
                type="number"
                min={0}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
              />
            </label>
          </div>
          <label className="mt-4 flex items-center gap-2 font-sans text-sm text-mahogany/75">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="rounded border-mahogany/20"
            />
            Published on public site
          </label>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ToolbarButton onClick={() => setEditTarget(null)}>Cancel</ToolbarButton>
            <ToolbarButton primary disabled={isPending || !title.trim()} onClick={save}>
              {isPending ? "Saving…" : "Save"}
            </ToolbarButton>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
