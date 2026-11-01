import { PRIORITY_CLASSES, PRIORITY_LABELS } from "../lib/project";
import { formatDueDate } from "../lib/task";
import type { Task } from "../types";

interface TaskCardProps {
  task: Task;
  draggable: boolean;
  isDragging: boolean;
}

export default function TaskCard({ task, draggable, isDragging }: TaskCardProps) {
  return (
    <div
      className={`rounded-lg border bg-slate-900 p-3 ${
        task.isOverdue ? "border-red-500/40" : "border-slate-800"
      } ${draggable ? "cursor-grab" : ""} ${
        isDragging ? "ring-2 ring-indigo-500 shadow-xl" : ""
      }`}
    >
      <p className="text-sm font-medium">{task.title}</p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[task.priority]}`}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
        {task.isOverdue && (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
            Overdue
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span className="truncate">
          {task.assignedTo ? task.assignedTo.name : "Unassigned"}
        </span>
        <span className="shrink-0">{formatDueDate(task.dueDate)}</span>
      </div>
    </div>
  );
}