import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { apiMessage } from "../lib/errors";
import { PRIORITY_CLASSES, PRIORITY_LABELS } from "../lib/project";
import { formatDueDate, TASK_STATUSES, TASK_STATUS_LABELS } from "../lib/task";
import type { Assignee, Priority, Task, TaskStatus } from "../types";
import ConfirmDialog from "./ConfirmDialog";
import { buttonClass, inputClass, labelClass } from "./ui";

const dateInputClass = `${inputClass} [color-scheme:dark]`;

const smallButton =
  "rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:cursor-pointer hover:bg-slate-800";

const dangerButton =
  "rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:cursor-pointer hover:bg-red-500/10";

interface Permissions {
  canManage: boolean;
  canUpdateStatus: boolean;
  canEditDescription: boolean;
}

interface TaskDrawerProps {
  taskId: string;
  projectId: string;
  archived: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export default function TaskDrawer({
  taskId,
  projectId,
  archived,
  onClose,
  onChanged,
}: TaskDrawerProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [assignees, setAssignees] = useState<Assignee[]>([]);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [saving, setSaving] = useState(false);

  const [statusSaving, setStatusSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      setTask(res.data.task);
      setPermissions(res.data.permissions);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const canManage = !!permissions?.canManage && !archived;

  useEffect(() => {
    if (!canManage) return;

    api
      .get(`/projects/${projectId}/assignees`)
      .then((res) => setAssignees(res.data.assignees))
      .catch(() => setAssignees([]));
  }, [canManage, projectId]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmDelete) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, confirmDelete]);

  const canEdit =
    !archived && !!permissions && (permissions.canManage || permissions.canEditDescription);
  const canChangeStatus = !archived && !!permissions?.canUpdateStatus;

  const startEdit = () => {
    if (!task) return;

    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setAssigneeId(task.assignedToId ?? "");
    setEditing(true);
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!task || !permissions) return;

    if (permissions.canManage && !title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      // An assigned Developer may only send the description
      const body = permissions.canManage
        ? {
            title,
            description,
            priority,
            dueDate: dueDate || null,
            assignedToId: assigneeId || null,
          }
        : { description };

      await api.patch(`/tasks/${task.id}`, body);
      toast.success("Task updated");
      setEditing(false);
      await load();
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, "Could not update the task"));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task || status === task.status) return;

    setStatusSaving(true);
    try {
      // A big position puts the task at the end of the column
      await api.patch(`/tasks/${task.id}/move`, { status, position: 9999 });
      toast.success(`Moved to ${TASK_STATUS_LABELS[status]}`);
      await load();
      onChanged();
    } catch (err) {
      toast.error(apiMessage(err, "Could not change the status"));
    } finally {
      setStatusSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;

    setDeleting(true);
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success("Task deleted");
      onChanged();
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, "Could not delete the task"));
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const assigneeMissing =
    !!task?.assignedTo && !assignees.some((a) => a.id === task.assignedTo?.id);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      <aside className="fixed right-0 top-0 z-40 h-full w-full max-w-lg overflow-y-auto border-l border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">Task details</h2>
          <button onClick={onClose} className={smallButton} aria-label="Close">
            Close
          </button>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-400">Loading...</p>}

        {notFound && (
          <p className="mt-6 text-sm text-red-300">
            This task could not be found. It may have been deleted.
          </p>
        )}

        {task && permissions && !editing && (
          <div className="mt-6 space-y-5">
            <div>
              <h3 className="text-xl font-bold">{task.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_CLASSES[task.priority]}`}
                >
                  {PRIORITY_LABELS[task.priority]} priority
                </span>
                {task.isOverdue && (
                  <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300">
                    Overdue
                  </span>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="taskStatus" className={labelClass}>Status</label>
              {canChangeStatus ? (
                <select
                  id="taskStatus"
                  value={task.status}
                  disabled={statusSaving}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className={inputClass}
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm">{TASK_STATUS_LABELS[task.status]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500">Assigned to</p>
                <p className="mt-1">
                  {task.assignedTo ? task.assignedTo.name : "Unassigned"}
                </p>
                {task.assignedTo && (
                  <p className="text-xs text-slate-400">{task.assignedTo.email}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">Due date</p>
                <p className="mt-1">{formatDueDate(task.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Created by</p>
                <p className="mt-1">{task.createdBy.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="mt-1">{new Date(task.createdAt).toLocaleString()}</p>
              </div>
              {task.completedAt && (
                <div className="col-span-2">
                  <p className="text-xs text-slate-500">Completed</p>
                  <p className="mt-1">{new Date(task.completedAt).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-500">Description</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">
                {task.description || "No description"}
              </p>
            </div>

            {archived && (
              <p className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
                This project is archived, so the task is read-only.
              </p>
            )}

            <div className="flex gap-3">
              {canEdit && (
                <button onClick={startEdit} className={smallButton}>
                  Edit task
                </button>
              )}
              {canManage && (
                <button onClick={() => setConfirmDelete(true)} className={dangerButton}>
                  Delete task
                </button>
              )}
            </div>
          </div>
        )}

        {task && permissions && editing && (
          <form onSubmit={handleSave} className="mt-6 space-y-4">
            {permissions.canManage ? (
              <div>
                <label htmlFor="editTitle" className={labelClass}>Title</label>
                <input
                  id="editTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                You can edit the description of a task assigned to you. The other
                fields are managed by the project lead.
              </p>
            )}

            <div>
              <label htmlFor="editDescription" className={labelClass}>Description</label>
              <textarea
                id="editDescription"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={inputClass}
              />
            </div>

            {permissions.canManage && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="editPriority" className={labelClass}>Priority</label>
                    <select
                      id="editPriority"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className={inputClass}
                    >
                      {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                        <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="editDue" className={labelClass}>Due date</label>
                    <input
                      id="editDue"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={dateInputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="editAssignee" className={labelClass}>Assign to</label>
                  <select
                    id="editAssignee"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Unassigned</option>
                    {assigneeMissing && task.assignedTo && (
                      <option value={task.assignedTo.id}>
                        {task.assignedTo.name} (no longer in a linked team)
                      </option>
                    )}
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.teams.join(", ")})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={saving} className={`${buttonClass} !w-auto`}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className={smallButton}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete task"
        message="This permanently deletes the task and its comments. This cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setConfirmDelete(false)}
      />
    </>
  );
}