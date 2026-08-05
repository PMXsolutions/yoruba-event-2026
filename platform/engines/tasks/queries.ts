import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnvPresence } from "@/lib/supabase/env-status";
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
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: TaskRow): TaskRecord {
  const status = (TASK_STATUSES as readonly string[]).includes(row.status)
    ? (row.status as TaskStatus)
    : "todo";
  const priority = (TASK_PRIORITIES as readonly string[]).includes(row.priority)
    ? (row.priority as TaskPriority)
    : "medium";
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status,
    priority,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type FetchTasksResult =
  | { ok: true; records: TaskRecord[] }
  | { ok: false; message: string };

export async function fetchTasks(): Promise<FetchTasksResult> {
  const env = getSupabaseEnvPresence();
  if (!env.serviceRoleReady) return { ok: false, message: "Database is not configured." };
  const event = getActiveEventConfig();
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("event_slug", event.slug)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[tasks] Query failed:", error.message);
      return { ok: false, message: "Unable to load tasks." };
    }
    return { ok: true, records: (data ?? []).map((r) => mapRow(r as TaskRow)) };
  } catch {
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
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        event_slug: event.slug,
        title: d.title,
        description: d.description?.trim() || null,
        status: d.status,
        priority: d.priority,
        due_date: d.dueDate || null,
        assigned_to: d.assignedTo || null,
        created_by: createdBy,
      })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[tasks] Create failed:", error?.message);
      return { ok: false, error: "Could not create task." };
    }
    return { ok: true, id: data.id };
  } catch {
    return { ok: false, error: "Could not create task." };
  }
}

export async function updateTask(
  id: string,
  raw: Partial<TaskFormValues>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const payload: Record<string, unknown> = {};
    if (raw.title !== undefined) payload.title = raw.title.trim();
    if (raw.description !== undefined) payload.description = raw.description?.trim() || null;
    if (raw.status !== undefined) payload.status = raw.status;
    if (raw.priority !== undefined) payload.priority = raw.priority;
    if (raw.dueDate !== undefined) payload.due_date = raw.dueDate || null;
    if (raw.assignedTo !== undefined) payload.assigned_to = raw.assignedTo || null;

    const { error } = await supabase.from("tasks").update(payload).eq("id", id);
    if (error) return { ok: false, error: "Could not update task." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not update task." };
  }
}

export async function deleteTask(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return { ok: false, error: "Could not delete task." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not delete task." };
  }
}
