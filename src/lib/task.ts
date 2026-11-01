import type { TaskStatus } from "../types";

export const TASK_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  COMPLETED: "Completed",
};

export const COLUMN_DOT: Record<TaskStatus, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-sky-400",
  IN_REVIEW: "bg-amber-400",
  COMPLETED: "bg-emerald-400",
};

// Due dates are saved as the end of the day in UTC, so show them in UTC too
export const formatDueDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No due date";