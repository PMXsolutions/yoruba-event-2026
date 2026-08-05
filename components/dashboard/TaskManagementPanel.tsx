"use client";

import { useMemo, useState, useTransition } from "react";
import { createTaskAction, updateTaskAction } from "@/app/actions/dashboard";
import {
  EmptyState,
  PageToolbar,
  SectionHeader,
  StatGrid,
  StatusBadge,
  ToolbarButton,
} from "@/components/dashboard/dashboard-ui";
import { ModalShell } from "@/components/dashboard/ModalShell";
import {
  formatTaskPriority,
  formatTaskStatus,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/platform/engines/tasks/schema";

type StatusFilter = "all" | TaskStatus;

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

export function TaskManagementPanel({
  records,
  error,
}: {
  records: TaskRecord[];
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionError, setActionError] = useState<string | null>(error ?? null);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => {
    const by = (s: TaskStatus) => records.filter((r) => r.status === s).length;
    const high = records.filter((r) => r.priority === "high" || r.priority === "urgent").length;
    return [
      { label: "Total", value: String(records.length), icon: "☑" },
      { label: "Todo", value: String(by("todo")), icon: "○" },
      { label: "In progress", value: String(by("in_progress")), icon: "◷" },
      { label: "High / urgent", value: String(high), icon: "!" },
    ];
  }, [records]);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("todo");
    setDueDate("");
  }

  function createTask() {
    setActionError(null);
    startTransition(async () => {
      const result = await createTaskAction({
        title,
        description: description || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
      });
      if (!result.ok) setActionError(result.error ?? "Could not create task.");
      else {
        setCreateOpen(false);
        resetForm();
      }
    });
  }

  function updateStatus(id: string, next: TaskStatus) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateTaskAction(id, { status: next });
      if (!result.ok) setActionError(result.error ?? "Could not update task.");
    });
  }

  function updatePriority(id: string, next: TaskPriority) {
    setActionError(null);
    startTransition(async () => {
      const result = await updateTaskAction(id, { priority: next });
      if (!result.ok) setActionError(result.error ?? "Could not update task.");
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ToolbarButton
          primary
          onClick={() => {
            resetForm();
            setCreateOpen(true);
          }}
        >
          + New task
        </ToolbarButton>
      </div>

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
            title="Committee tasks"
            description="Owners, priorities, and progress across workstreams"
          />
          <div className="mt-4">
            <PageToolbar>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks…"
                aria-label="Search tasks"
                className="w-full min-w-0 basis-full rounded-lg border border-mahogany/10 bg-cream/30 px-3 py-2 font-sans text-sm text-mahogany outline-none placeholder:text-mahogany/35 focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10 sm:basis-auto sm:min-w-[12rem] sm:flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                aria-label="Filter by status"
                className="rounded-lg border border-mahogany/10 bg-white px-3 py-2 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10"
              >
                <option value="all">All statuses</option>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatTaskStatus(s)}
                  </option>
                ))}
              </select>
            </PageToolbar>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={records.length === 0 ? "No tasks yet" : "No matching tasks"}
            message={
              records.length === 0
                ? "Create a task to track committee workstreams and deadlines."
                : "Try adjusting your search or filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left font-sans text-sm">
              <thead>
                <tr className="border-b border-mahogany/[0.05] bg-cream/40">
                  {["Task", "Due", "Priority", "Status"].map((h) => (
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
                    <td className="max-w-[20rem] px-5 py-4 sm:px-6">
                      <p className="font-medium text-mahogany">{r.title}</p>
                      {r.description ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-mahogany/50">{r.description}</p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-mahogany/65 sm:px-6">
                      {formatDateShort(r.dueDate)}
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <select
                        value={r.priority}
                        disabled={isPending}
                        aria-label={`Priority for ${r.title}`}
                        onChange={(e) => updatePriority(r.id, e.target.value as TaskPriority)}
                        className="rounded-lg border border-mahogany/10 bg-white px-2 py-1.5 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35"
                      >
                        {TASK_PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {formatTaskPriority(p)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={formatTaskStatus(r.status)} />
                        <select
                          value={r.status}
                          disabled={isPending}
                          aria-label={`Status for ${r.title}`}
                          onChange={(e) => updateStatus(r.id, e.target.value as TaskStatus)}
                          className="rounded-lg border border-mahogany/10 bg-white px-2 py-1.5 font-sans text-xs font-semibold text-mahogany/75 outline-none focus:border-gold/35"
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {formatTaskStatus(s)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {createOpen ? (
        <ModalShell title="Create task" showTitle onClose={() => setCreateOpen(false)}>
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
            />
          </label>
          <label className="mt-4 block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5 w-full resize-y rounded-xl border border-mahogany/10 bg-cream/30 px-4 py-3 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white focus:ring-2 focus:ring-gold/10"
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-white px-3 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35"
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {formatTaskStatus(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              Priority
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-white px-3 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {formatTaskPriority(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block font-sans text-xs font-semibold uppercase tracking-wide text-mahogany/45">
              Due date
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-mahogany/10 bg-cream/30 px-3 py-2.5 font-sans text-sm text-mahogany outline-none focus:border-gold/35 focus:bg-white"
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <ToolbarButton onClick={() => setCreateOpen(false)}>Cancel</ToolbarButton>
            <ToolbarButton primary disabled={isPending || !title.trim()} onClick={createTask}>
              {isPending ? "Creating…" : "Create"}
            </ToolbarButton>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}
