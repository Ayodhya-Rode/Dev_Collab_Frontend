import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { apiMessage } from "../lib/errors";
import { PRIORITY_LABELS } from "../lib/project";
import { COLUMN_DOT, TASK_STATUSES, TASK_STATUS_LABELS } from "../lib/task";
import type {
  Assignee,
  Priority,
  ProjectStatus,
  Task,
  TaskStatus,
} from "../types";
import TaskCard from "./TaskCard";
import { buttonClass, errorClass, inputClass, labelClass } from "./ui";
import TaskDrawer from "./TaskDrawer";

const dateInputClass = `${inputClass} [color-scheme:dark]`;

interface TaskBoardProps {
  projectId: string;
  projectStatus: ProjectStatus;
  projectLeadId: string;
  onChanged: () => void;
}

export default function TaskBoard({
  projectId,
  projectStatus,
  projectLeadId,
  onChanged,
}: TaskBoardProps) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [moving, setMoving] = useState(false);

  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const archived = projectStatus === "ARCHIVED";
  const isLead = user?.role === "TEAM_LEADER" && user.id === projectLeadId;
  const canCreate = isLead && !archived;

  const loadTasks = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      setTasks(res.data.tasks);
      setLoadError("");
    } catch {
      setLoadError("Could not load tasks");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (!canCreate) return;

    api
      .get(`/projects/${projectId}/assignees`)
      .then((res) => setAssignees(res.data.assignees))
      .catch(() => setAssignees([]));
  }, [canCreate, projectId]);

  const columns = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      IN_REVIEW: [],
      COMPLETED: [],
    };

    [...tasks]
      .sort((a, b) => a.position - b.position)
      .forEach((t) => map[t.status].push(t));

    return map;
  }, [tasks]);

  // The lead can move any task, a Developer only the ones assigned to them
  const canMove = (task: Task) =>
    !archived &&
    !moving &&
    (isLead || (user?.role === "DEVELOPER" && task.assignedToId === user.id));

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const from = source.droppableId as TaskStatus;
    const to = destination.droppableId as TaskStatus;
    const previous = tasks;

    const next: Record<TaskStatus, Task[]> = {
      TODO: [...columns.TODO],
      IN_PROGRESS: [...columns.IN_PROGRESS],
      IN_REVIEW: [...columns.IN_REVIEW],
      COMPLETED: [...columns.COMPLETED],
    };

    const [moved] = next[from].splice(source.index, 1);
    if (!moved) return;

    next[to].splice(destination.index, 0, { ...moved, status: to });

    // Show the new order straight away, then confirm it with the server
    setTasks(
      TASK_STATUSES.flatMap((status) =>
        next[status].map((t, i) => ({ ...t, position: i + 1 })),
      ),
    );
    setMoving(true);

    try {
      await api.patch(`/tasks/${draggableId}/move`, {
        status: to,
        position: destination.index,
      });
      await loadTasks();
      onChanged();
    } catch (err) {
      setTasks(previous);
      toast.error(apiMessage(err, "Could not move the task"));
    } finally {
      setMoving(false);
    }
  };

  const refreshAll = async () => {
    await loadTasks();
    onChanged();
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("Task title is required");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/tasks`, {
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined,
        assignedToId: assigneeId || undefined,
      });

      toast.success("Task created");
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setAssigneeId("");
      setShowForm(false);

      await loadTasks();
      onChanged();
    } catch (err) {
      setFormError(apiMessage(err, "Could not create the task"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Tasks</h2>
          <p className="mt-1 text-xs text-slate-400">
            {archived
              ? "This project is archived, so the board is read-only."
              : isLead
                ? "Drag a card to change its status or order."
                : user?.role === "DEVELOPER"
                  ? "You can move the tasks assigned to you."
                  : "View only."}
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-indigo-400"
          >
            {showForm ? "Cancel" : "Add task"}
          </button>
        )}
      </div>

      {canCreate && showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-5 max-w-2xl space-y-4 rounded-lg border border-slate-800 bg-slate-950/40 p-4"
        >
          {formError && <p className={errorClass}>{formError}</p>}

          <div>
            <label htmlFor="taskTitle" className={labelClass}>
              Title
            </label>
            <input
              id="taskTitle"
              type="text"
              placeholder="Design the login API"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="taskDescription" className={labelClass}>
              Description (optional)
            </label>
            <textarea
              id="taskDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="taskPriority" className={labelClass}>
                Priority
              </label>
              <select
                id="taskPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className={inputClass}
              >
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="taskDue" className={labelClass}>
                Due date
              </label>
              <input
                id="taskDue"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={dateInputClass}
              />
            </div>

            <div>
              <label htmlFor="taskAssignee" className={labelClass}>
                Assign to
              </label>
              <select
                id="taskAssignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className={inputClass}
              >
                <option value="">Unassigned</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.teams.join(", ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {assignees.length === 0 && (
            <p className="text-xs text-slate-500">
              No Developers in the linked teams yet. Invite a Developer to one
              of the teams to assign tasks.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`${buttonClass} !w-auto`}
          >
            {submitting ? "Creating..." : "Create task"}
          </button>
        </form>
      )}

      {loading && (
        <p className="mt-6 text-sm text-slate-400">Loading tasks...</p>
      )}
      {loadError && <p className={`${errorClass} mt-6`}>{loadError}</p>}

      {!loading && !loadError && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {TASK_STATUSES.map((status) => (
              <div
                key={status}
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${COLUMN_DOT[status]}`}
                    />
                    <h3 className="text-sm font-semibold">
                      {TASK_STATUS_LABELS[status]}
                    </h3>
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                    {columns[status].length}
                  </span>
                </div>

                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-24 space-y-2 rounded-md p-1 transition ${
                        snapshot.isDraggingOver ? "bg-slate-800/60" : ""
                      }`}
                    >
                      {columns[status].length === 0 &&
                        !snapshot.isDraggingOver && (
                          <p className="py-4 text-center text-xs text-slate-500">
                            No tasks
                          </p>
                        )}

                      {columns[status].map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                          isDragDisabled={!canMove(task)}
                        >
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              onClick={() => setOpenTaskId(task.id)}
                            >
                              <TaskCard
                                task={task}
                                draggable={canMove(task)}
                                isDragging={dragSnapshot.isDragging}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {openTaskId && (
        <TaskDrawer
          key={openTaskId}
          taskId={openTaskId}
          projectId={projectId}
          archived={archived}
          onClose={() => setOpenTaskId(null)}
          onChanged={refreshAll}
        />
      )}
    </div>
  );
}
