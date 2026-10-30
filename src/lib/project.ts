import type { Priority, ProjectStatus } from "../types";

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export const STATUS_CLASSES: Record<ProjectStatus, string> = {
  PLANNING: "bg-sky-500/15 text-sky-300",
  ACTIVE: "bg-emerald-500/15 text-emerald-300",
  ON_HOLD: "bg-amber-500/15 text-amber-300",
  COMPLETED: "bg-indigo-500/15 text-indigo-300",
  ARCHIVED: "bg-slate-700 text-slate-300",
};

export const PRIORITY_CLASSES: Record<Priority, string> = {
  LOW: "bg-slate-700 text-slate-300",
  MEDIUM: "bg-yellow-500/15 text-yellow-300",
  HIGH: "bg-red-500/15 text-red-300",
};

// Project dates are stored as DATE (no time), so format them in UTC to avoid a one-day shift
export const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";