"use client";

import { useMemo, useState, useTransition } from "react";
import {
  archiveAnnouncementAction,
  publishAnnouncementAction,
  saveAnnouncementAction,
} from "@/app/actions/dashboard";
import {
  EmptyState,
  PageToolbar,
  SectionHeader,
  StatusBadge,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import { ModalShell } from "@/components/dashboard/ModalShell";
import type { AnnouncementRecord } from "@/platform/engines/announcements/schema";

function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
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

export function AnnouncementManagementPanel({
  records,
  error,
}: {
  records: AnnouncementRecord[];
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [actionError, setActionError] = useState<string | null>(error ?? null);
  const [editTarget, setEditTarget] = useState<AnnouncementRecord | null | "new">(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) => r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q),
    );
  }, [records, search]);

  function openCreate() {
    setEditTarget("new");
    setTitle("");
    setBody("");
    setIsPublished(false);
    setScheduledFor("");
  }

  function openEdit(r: AnnouncementRecord) {
    setEditTarget(r);
    setTitle(r.title);
    setBody(r.body);
    setIsPublished(r.isPublished);
    setScheduledFor(r.scheduledFor ? r.scheduledFor.slice(0, 16) : "");
  }

  function save() {
    setActionError(null);
    const id = editTarget && editTarget !== "new" ? editTarget.id : undefined;
    startTransition(async () => {
      const result = await saveAnnouncementAction(
        {
          title,
          body,
          isPublished,
          scheduledFor: scheduledFor || undefined,
        },
        id,
      );
      if (!result.ok) setActionError(result.error ?? "Could not save announcement.");
      else setEditTarget(null);
    });
  }

  function togglePublish(r: AnnouncementRecord) {
    setActionError(null);
    startTransition(async () => {
      const result = await publishAnnouncementAction(r.id, !r.isPublished);
      if (!result.ok) setActionError(result.error ?? "Could not update publish state.");
    });
  }

  function archive(id: string) {
    if (!window.confirm("Archive this announcement?")) return;
    setActionError(null);
    startTransition(async () => {
      const result = await archiveAnnouncementAction(id);
      if (!result.ok) setActionError(result.error ?? "Could not archive announcement.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ToolbarButton primary onClick={openCreate}>
          + New announcement
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
            title="Announcements"
            description="Draft, publish, and archive committee communications"
          />
          <div className="mt-4">
            <PageToolbar>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search announcements…"
                aria-label="Search announcements"
                className="w-full min-w-0 flex-1 rounded-lg border border-mahogany/10 bg-cream/30 px-3 py-2 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
              />
            </PageToolbar>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={records.length === 0 ? "No announcements yet" : "No matching announcements"}
            message={
              records.length === 0
                ? "Create an announcement to share updates with the community."
                : "Try adjusting your search."
            }
          />
        ) : (
          <div className="divide-y divide-mahogany/[0.04]">
            {filtered.map((r) => (
              <article key={r.id} className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold text-mahogany">{r.title}</h3>
                      <StatusBadge status={r.isPublished ? "Published" : "Draft"} />
                    </div>
                    <p className="mt-2 line-clamp-3 font-sans text-sm leading-relaxed text-mahogany/65">
                      {r.body}
                    </p>
                    <p className="mt-2 font-sans text-xs text-mahogany/45">
                      Created {formatDateShort(r.createdAt)}
                      {r.publishedAt ? ` · Published ${formatDateShort(r.publishedAt)}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <ToolbarButton onClick={() => openEdit(r)}>Edit</ToolbarButton>
                    <ToolbarButton onClick={() => togglePublish(r)}>
                      {r.isPublished ? "Unpublish" : "Publish"}
                    </ToolbarButton>
                    <ToolbarButton onClick={() => archive(r.id)}>Archive</ToolbarButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editTarget ? (
        <ModalShell
          title={editTarget === "new" ? "New announcement" : "Edit announcement"}
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
            Body
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="mt-1.5 w-full resize-y rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-3 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
            />
          </label>
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
            Schedule for (optional)
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-3 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
            />
          </label>
          <label className="mt-4 flex items-center gap-2 font-sans text-sm text-mahogany/75">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded border-mahogany/20"
            />
            Publish immediately
          </label>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ToolbarButton onClick={() => setEditTarget(null)}>Cancel</ToolbarButton>
            <ToolbarButton
              primary
              disabled={isPending || !title.trim() || !body.trim()}
              onClick={save}
            >
              {isPending ? "Saving…" : "Save"}
            </ToolbarButton>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
