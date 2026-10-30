import {
  PRIORITY_CLASSES,
  PRIORITY_LABELS,
  STATUS_CLASSES,
  STATUS_LABELS,
} from "../lib/project";
import type { Priority, ProjectStatus } from "../types";

const base = "rounded-full px-2 py-0.5 text-xs font-medium";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return <span className={`${base} ${STATUS_CLASSES[status]}`}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`${base} ${PRIORITY_CLASSES[priority]}`}>
      {PRIORITY_LABELS[priority]} priority
    </span>
  );
}