import { assertPermission } from "@/lib/auth/rbac";
import "server-only";

import { getDatabaseEnvPresence } from "@/lib/db/connection";
import { errorMessage } from "@/lib/db/connectivity";
import { dbExec, dbOne, dbQuery } from "@/lib/db/query";
import { asIso, isUuid } from "@/lib/db/values";
import { getActiveEventConfig } from "@/platform/core/config/active-event";
import {
  taskFormSchema,
  type TaskFormValues,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/platform/engines/tasks/schema";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function mapRow(row: TaskRow): TaskRecord {
  const status = (TASK_STATUSES as readonly string[]).includes(row.status)
    ? (row.status as TaskStatus)
    : "todo";
  const priority = (TASK_PRIORITIES as readonly string[]).includes(row.priority)
    ? (row.priority as TaskPriority)
    : "medium";
  const due = asIso(row.due_date);
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status,
    priority,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    dueDate: due ? due.slice(0, 10) : null,
    createdAt: asIso(row.created_at) ?? "",
    updatedAt: asIso(row.updated_at) ?? "",
  };
}

export type FetchTasksResult =
  | { ok: true; records: TaskRecord[] }
  | { ok: false; message: string };

export async function fetchTasks(): Promise<FetchTasksResult> {
  await assertPermission("task.read");
  const env = getDatabaseEnvPresence();
  if (!env.ready) return { ok: false, message: "Database is not configured." };
  const event = getActiveEventConfig();
  try {
    const rows = await dbQuery<TaskRow>(
      `SELECT id, title, description, status, priority, assigned_to, created_by, due_date, created_at, updated_at
       FROM tasks WHERE event_slug = @slug ORDER BY created_at DESC`,
      { slug: event.slug },
    );
    return { ok: true, records: rows.map(mapRow) };
  } catch (error) {
    console.error("[tasks] Query failed:", errorMessage(error));
    return { ok: false, message: "Unable to load tasks." };
  }
}

export async function createTask(
  raw: unknown,
  createdBy: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const parsed = taskFormSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Please check the task details." };

  const event = getActiveEventConfig();
  const d = parsed.data;
  try {
    const created = await dbOne<{ id: string }>(
      `INSERT INTO tasks (event_slug, title, description, status, priority, due_date, assigned_to, created_by)
       OUTPUT INSERTED.id
       VALUES (@slug, @title, @description, @status, @priority, TRY_CONVERT(date, @dueDate), @assignedTo, @createdBy)`,
      {
        slug: event.slug,
        title: d.title,
        description: d.description?.trim() || null,
        status: d.status,
        priority: d.priority,
        dueDate: d.dueDate || null,
        assignedTo: isUuid(d.assignedTo) ? d.assignedTo : null,
        createdBy: isUuid(createdBy) ? createdBy : null,
      },
    );
    if (!created) return { ok: false, error: "Could not create task." };
    return { ok: true, id: created.id };
  } catch (error) {
    console.error("[tasks] Create failed:", errorMessage(error));
    return { ok: false, error: "Could not create task." };
  }
}

export async function updateTask(
  id: string,
  raw: Partial<TaskFormValues>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const sets: string[] = ["updated_at = SYSDATETIMEOFFSET()"];
    const params: Record<string, unknown> = { id };
    if (raw.title !== undefined) {
      sets.push("title = @title");
      params.title = raw.title.trim();
    }
    if (raw.description !== undefined) {
      sets.push("description = @description");
      params.description = raw.description?.trim() || null;
    }
    if (raw.status !== undefined) {
      sets.push("status = @status");
      params.status = raw.status;
    }
    if (raw.priority !== undefined) {
      sets.push("priority = @priority");
      params.priority = raw.priority;
    }
    if (raw.dueDate !== undefined) {
      sets.push("due_date = TRY_CONVERT(date, @dueDate)");
      params.dueDate = raw.dueDate || null;
    }
    if (raw.assignedTo !== undefined) {
      sets.push("assigned_to = @assignedTo");
      params.assignedTo = isUuid(raw.assignedTo) ? raw.assignedTo : null;
    }
    const updated = await dbExec(`UPDATE tasks SET ${sets.join(", ")} WHERE id = @id`, params);
    if (updated === 0) return { ok: false, error: "Could not update task." };
    return { ok: true };
  } catch (error) {
    console.error("[tasks] Update failed:", errorMessage(error));
    return { ok: false, error: "Could not update task." };
  }
}
