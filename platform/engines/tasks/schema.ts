import { z } from "zod";

export const TASK_STATUSES = ["todo", "in_progress", "blocked", "completed"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(200),
  description: z.string().trim().max(4000).optional(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().optional(),
  assignedTo: z.string().uuid().optional().or(z.literal("")),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  createdBy: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export function formatTaskStatus(status: TaskStatus): string {
  const labels: Record<TaskStatus, string> = {
    todo: "Todo",
    in_progress: "In Progress",
    blocked: "Blocked",
    completed: "Completed",
  };
  return labels[status];
}

export function formatTaskPriority(priority: TaskPriority): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}
