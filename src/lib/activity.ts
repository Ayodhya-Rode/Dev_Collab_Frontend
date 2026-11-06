import type { ActivityEntry, Priority, TaskStatus } from "../types";
import { PRIORITY_LABELS } from "./project";
import { formatDueDate, TASK_STATUS_LABELS } from "./task";

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const statusLabel = (value: unknown) =>
  typeof value === "string" && value in TASK_STATUS_LABELS
    ? TASK_STATUS_LABELS[value as TaskStatus]
    : "another status";

const priorityLabel = (value: unknown) =>
  typeof value === "string" && value in PRIORITY_LABELS
    ? PRIORITY_LABELS[value as Priority]
    : "another priority";

const describeChanges = (changes: Record<string, unknown>): string[] => {
  const parts: string[] = [];

  if ("title" in changes) {
    const title = asRecord(changes.title);
    parts.push(`renamed the task to "${String(title.to ?? "")}"`);
  }

  if ("description" in changes) {
    parts.push("edited the description");
  }

  if ("priority" in changes) {
    const priority = asRecord(changes.priority);
    parts.push(
      `changed the priority from ${priorityLabel(priority.from)} to ${priorityLabel(priority.to)}`,
    );
  }

  if ("dueDate" in changes) {
    const due = asRecord(changes.dueDate);
    parts.push(
      typeof due.to === "string"
        ? `set the due date to ${formatDueDate(due.to)}`
        : "removed the due date",
    );
  }

  if ("assignedToId" in changes) {
    const assignee = asRecord(changes.assignedToId);

    if (!assignee.to) parts.push("unassigned the task");
    else if (!assignee.from) parts.push("assigned the task");
    else parts.push("reassigned the task");
  }

  return parts;
};

export const describeActivity = (entry: ActivityEntry): string => {
  const who = entry.user.name;
  const details = asRecord(entry.details);

  switch (entry.action) {
    case "TASK_CREATED":
      return `${who} created this task`;

    case "TASK_UPDATED": {
      const parts = describeChanges(asRecord(details.changes));
      return parts.length > 0
        ? `${who} ${parts.join(", ")}`
        : `${who} updated this task`;
    }

    case "TASK_STATUS_CHANGED":
      return `${who} moved this task from ${statusLabel(details.from)} to ${statusLabel(details.to)}`;

    case "TASK_REORDERED":
      return `${who} reordered this task in ${statusLabel(details.status)}`;

    case "COMMENT_ADDED":
      return `${who} added a comment`;

    case "PR_LINKED":
      return `${who} linked pull request #${String(details.prNumber ?? "")}`;

    case "PR_UNLINKED":
      return `${who} unlinked pull request #${String(details.prNumber ?? "")}`;

    default:
      return `${who} made a change`;
  }
};
