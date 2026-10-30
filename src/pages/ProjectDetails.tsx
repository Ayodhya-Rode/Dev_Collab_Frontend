import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { PriorityBadge, StatusBadge } from "../components/ProjectBadges";
import { formatDate, PRIORITY_LABELS, STATUS_LABELS } from "../lib/project";
import type { Priority, ProjectDetail, ProjectStatus, TeamSummary } from "../types";
import { buttonClass, errorClass, inputClass, labelClass } from "../components/ui";

const apiMessage = (err: unknown, fallback: string) =>
  axios.isAxiosError(err)
    ? (err.response?.data?.message ?? fallback)
    : "Something went wrong";

const smallButton =
  "rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:cursor-pointer hover:bg-slate-800";

const dangerButton =
  "rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 transition hover:cursor-pointer hover:bg-red-500/10";

const dateInputClass = `${inputClass} [color-scheme:dark]`;

const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : "");

interface ConfirmState {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [canManage, setCanManage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [allTeams, setAllTeams] = useState<TeamSummary[]>([]);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<ProjectStatus>("PLANNING");
  const [editPriority, setEditPriority] = useState<Priority>("MEDIUM");
  const [editStart, setEditStart] = useState("");
  const [editDue, setEditDue] = useState("");
  const [saving, setSaving] = useState(false);

  const [newLeaderId, setNewLeaderId] = useState("");
  const [savingLeader, setSavingLeader] = useState(false);

  const [editingTeams, setEditingTeams] = useState(false);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [savingTeams, setSavingTeams] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirming, setConfirming] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.project);
      setCanManage(res.data.canManage);
      setNotFound(false);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (!canManage) return;

    api
      .get("/teams")
      .then((res) => setAllTeams(res.data.teams))
      .catch(() => setAllTeams([]));
  }, [canManage]);

  // Teams this user may link or unlink: the Admin any active team,
  // a Team Leader only the teams they lead
  const editableTeams = useMemo(
    () =>
      allTeams.filter(
        (t) => t.status === "ACTIVE" && (isAdmin || t.teamLeaderId === user?.id),
      ),
    [allTeams, isAdmin, user?.id],
  );

  // Possible new leads: leaders of the linked teams, except the current lead
  const leaderOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    project?.teams.forEach(({ team }) => {
      if (team.teamLeader && team.teamLeader.id !== project.teamLeaderId) {
        map.set(team.teamLeader.id, team.teamLeader);
      }
    });

    return [...map.values()];
  }, [project]);

  if (loading) return <p className="text-slate-400">Loading...</p>;

  if (notFound || !project) {
    return (
      <div>
        <p className={errorClass}>Project not found.</p>
        <Link to="/projects" className="text-sm text-indigo-300 hover:text-indigo-200">
          Back to projects
        </Link>
      </div>
    );
  }

  const isArchived = project.status === "ARCHIVED";
  const canEdit = canManage && (isAdmin || !isArchived);
  const statusOptions = (Object.keys(STATUS_LABELS) as ProjectStatus[]).filter(
    (s) => isAdmin || s !== "ARCHIVED",
  );

  const runConfirm = async () => {
    if (!confirm) return;

    setConfirming(true);
    try {
      await confirm.onConfirm();
    } finally {
      setConfirming(false);
      setConfirm(null);
    }
  };

  const startEdit = () => {
    setEditName(project.name);
    setEditDescription(project.description ?? "");
    setEditStatus(project.status);
    setEditPriority(project.priority);
    setEditStart(toDateInput(project.startDate));
    setEditDue(toDateInput(project.dueDate));
    setEditing(true);
  };

  const handleSaveEdit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editName.trim()) {
      toast.error("Project name cannot be empty");
      return;
    }
    if (editStart && editDue && editDue < editStart) {
      toast.error("Due date cannot be before the start date");
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/projects/${project.id}`, {
        name: editName,
        description: editDescription,
        status: editStatus,
        priority: editPriority,
        startDate: editStart || null,
        dueDate: editDue || null,
      });
      setEditing(false);
      toast.success("Project updated");
      await loadProject();
    } catch (err) {
      toast.error(apiMessage(err, "Could not update the project"));
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = () => {
    setConfirm({
      title: "Archive project",
      message: "Archived projects become read-only for Team Leaders. You can restore it later.",
      confirmLabel: "Archive",
      onConfirm: async () => {
        try {
          await api.patch(`/projects/${project.id}`, { status: "ARCHIVED" });
          toast.success("Project archived");
          await loadProject();
        } catch (err) {
          toast.error(apiMessage(err, "Could not archive the project"));
        }
      },
    });
  };

  const handleRestore = async () => {
    try {
      await api.patch(`/projects/${project.id}`, { status: "ACTIVE" });
      toast.success("Project restored");
      await loadProject();
    } catch (err) {
      toast.error(apiMessage(err, "Could not restore the project"));
    }
  };

  const handleChangeLead = async () => {
    if (!newLeaderId) {
      toast.error("Choose a new project lead");
      return;
    }

    setSavingLeader(true);
    try {
      await api.patch(`/projects/${project.id}/leader`, { teamLeaderId: newLeaderId });
      toast.success("Project lead changed");
      setNewLeaderId("");
      await loadProject();
    } catch (err) {
      toast.error(apiMessage(err, "Could not change the project lead"));
    } finally {
      setSavingLeader(false);
    }
  };

  const startTeamEdit = () => {
    const editableIds = new Set(editableTeams.map((t) => t.id));
    setSelectedTeamIds(
      project.teams.map((t) => t.team.id).filter((teamId) => editableIds.has(teamId)),
    );
    setEditingTeams(true);
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((x) => x !== teamId) : [...prev, teamId],
    );
  };

  const handleSaveTeams = async () => {
    // Teams the user cannot manage here stay linked
    const editableIds = new Set(editableTeams.map((t) => t.id));
    const preserved = project.teams
      .map((t) => t.team.id)
      .filter((teamId) => !editableIds.has(teamId));
    const teamIds = [...preserved, ...selectedTeamIds];

    if (teamIds.length === 0) {
      toast.error("A project must be linked to at least one team");
      return;
    }

    setSavingTeams(true);
    try {
      await api.put(`/projects/${project.id}/teams`, { teamIds });
      setEditingTeams(false);
      toast.success("Linked teams updated");
      await loadProject();
    } catch (err) {
      toast.error(apiMessage(err, "Could not update the teams"));
    } finally {
      setSavingTeams(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/projects" className="text-sm text-indigo-300 hover:text-indigo-200">
        &larr; Back to projects
      </Link>

      {isArchived && (
        <p className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
          This project is archived.
          {!isAdmin && " It is read-only."}
        </p>
      )}

      {/* Header */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        {!editing ? (
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {project.description || "No description"}
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              {canEdit && (
                <button onClick={startEdit} className={smallButton}>
                  Edit project
                </button>
              )}
              {isAdmin && !isArchived && (
                <button onClick={handleArchive} className={dangerButton}>
                  Archive
                </button>
              )}
              {isAdmin && isArchived && (
                <button onClick={handleRestore} className={smallButton}>
                  Restore
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label htmlFor="editName" className={labelClass}>Project name</label>
              <input
                id="editName"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="editDescription" className={labelClass}>Description</label>
              <textarea
                id="editDescription"
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="editStatus" className={labelClass}>Status</label>
                <select
                  id="editStatus"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                  className={inputClass}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="editPriority" className={labelClass}>Priority</label>
                <select
                  id="editPriority"
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className={inputClass}
                >
                  {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="editStart" className={labelClass}>Start date</label>
                <input
                  id="editStart"
                  type="date"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className={dateInputClass}
                />
              </div>

              <div>
                <label htmlFor="editDue" className={labelClass}>Due date</label>
                <input
                  id="editDue"
                  type="date"
                  value={editDue}
                  onChange={(e) => setEditDue(e.target.value)}
                  className={dateInputClass}
                />
              </div>
            </div>

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
      </div>

      {/* Info */}
      <div className="grid gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Start date</p>
          <p className="mt-1 text-sm">{formatDate(project.startDate)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Due date</p>
          <p className="mt-1 text-sm">{formatDate(project.dueDate)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Created by</p>
          <p className="mt-1 text-sm">{project.createdBy.name}</p>
        </div>
      </div>

      {/* Project lead */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="font-semibold">Project lead</h2>
        <p className="mt-3 text-sm font-medium">{project.teamLeader.name}</p>
        <p className="text-sm text-slate-400">{project.teamLeader.email}</p>

        {isAdmin && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={newLeaderId}
              onChange={(e) => setNewLeaderId(e.target.value)}
              disabled={leaderOptions.length === 0}
              className={`${inputClass} sm:flex-1`}
              aria-label="New project lead"
            >
              <option value="">
                {leaderOptions.length === 0
                  ? "No other Team Leader among the linked teams"
                  : "Choose a new project lead"}
              </option>
              {leaderOptions.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <button
              onClick={handleChangeLead}
              disabled={savingLeader || leaderOptions.length === 0}
              className={`${buttonClass} sm:!w-auto`}
            >
              {savingLeader ? "Changing..." : "Change lead"}
            </button>
          </div>
        )}

        {isAdmin && (
          <p className="mt-2 text-xs text-slate-500">
            The lead must be the Team Leader of one of the linked teams. Link the
            new lead&apos;s team first if it is not listed.
          </p>
        )}
      </div>

      {/* Linked teams */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Linked teams ({project.teams.length})</h2>
          {canEdit && !editingTeams && (
            <button onClick={startTeamEdit} className={smallButton}>
              Manage teams
            </button>
          )}
        </div>

        {!editingTeams ? (
          <ul className="mt-3 divide-y divide-slate-800">
            {project.teams.map(({ team }) => (
              <li key={team.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <Link
                    to={`/teams/${team.id}`}
                    className="text-sm font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    {team.name}
                  </Link>
                  <p className="text-xs text-slate-400">
                    Leader: {team.teamLeader ? team.teamLeader.name : "Not assigned"}
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  {team._count.members} member{team._count.members === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            {editableTeams.length === 0 ? (
              <p className="text-sm text-slate-400">No teams available to link.</p>
            ) : (
              <div className="space-y-2">
                {editableTeams.map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedTeamIds.includes(t.id)}
                      onChange={() => toggleTeam(t.id)}
                      className="h-4 w-4 accent-indigo-500"
                    />
                    <span>{t.name}</span>
                    <span className="text-xs text-slate-500">
                      {t.teamLeader ? `Leader: ${t.teamLeader.name}` : "No Team Leader"}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {!isAdmin && (
              <p className="mt-3 text-xs text-slate-500">
                Teams led by other Team Leaders stay linked; only an Admin can unlink
                them.
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSaveTeams}
                disabled={savingTeams}
                className={`${buttonClass} !w-auto`}
              >
                {savingTeams ? "Saving..." : "Save teams"}
              </button>
              <button onClick={() => setEditingTeams(false)} className={smallButton}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tasks (Phase 5) */}
      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        Tasks, progress and overdue counts will appear here.
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        confirmLabel={confirm?.confirmLabel}
        loading={confirming}
        onConfirm={runConfirm}
        onCancel={() => !confirming && setConfirm(null)}
      />
    </div>
  );
}