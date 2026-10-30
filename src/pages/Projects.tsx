import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { PriorityBadge, StatusBadge } from "../components/ProjectBadges";
import { formatDate, PRIORITY_LABELS, STATUS_LABELS } from "../lib/project";
import type { Priority, ProjectStatus, ProjectSummary, TeamSummary } from "../types";
import { buttonClass, errorClass, inputClass, labelClass } from "../components/ui";

const dateInputClass = `${inputClass} [color-scheme:dark]`;

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const canCreate = isAdmin || user?.role === "TEAM_LEADER";

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ProjectStatus>("ALL");

  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [leaderId, setLeaderId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects");
      setProjects(res.data.projects);
      setLoadError("");
    } catch {
      setLoadError("Could not load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!canCreate) return;

    api
      .get("/teams")
      .then((res) => setTeams(res.data.teams))
      .catch(() => setTeams([]));
  }, [canCreate]);

  // Teams the user may link: the Admin can pick any active team,
  // a Team Leader only the teams they lead
  const creatableTeams = useMemo(
    () =>
      teams.filter(
        (t) => t.status === "ACTIVE" && (isAdmin || t.teamLeaderId === user?.id),
      ),
    [teams, isAdmin, user?.id],
  );

  // For the Admin: the lead must be the Team Leader of one of the selected teams
  const leaderOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    creatableTeams
      .filter((t) => selectedTeamIds.includes(t.id) && t.teamLeader)
      .forEach((t) => map.set(t.teamLeader!.id, t.teamLeader!));

    return [...map.values()];
  }, [creatableTeams, selectedTeamIds]);

  const effectiveLeaderId = leaderOptions.some((l) => l.id === leaderId)
    ? leaderId
    : leaderOptions.length === 1
      ? leaderOptions[0].id
      : "";

  const visibleProjects = projects.filter(
    (p) => statusFilter === "ALL" || p.status === statusFilter,
  );

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId],
    );
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setPriority("MEDIUM");
    setStartDate("");
    setDueDate("");
    setSelectedTeamIds([]);
    setLeaderId("");
    setError("");
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Project name is required");
      return;
    }
    if (selectedTeamIds.length === 0) {
      setError("Select at least one team");
      return;
    }
    if (isAdmin && !effectiveLeaderId) {
      setError("Select a team that has a Team Leader, then choose the project lead");
      return;
    }
    if (startDate && dueDate && dueDate < startDate) {
      setError("Due date cannot be before the start date");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/projects", {
        name,
        description,
        priority,
        startDate: startDate || undefined,
        dueDate: dueDate || undefined,
        teamIds: selectedTeamIds,
        ...(isAdmin ? { teamLeaderId: effectiveLeaderId } : {}),
      });

      toast.success("Project created");
      resetForm();
      setShowForm(false);
      await loadProjects();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Could not create the project");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isAdmin
              ? "All projects in your organization"
              : user?.role === "TEAM_LEADER"
                ? "Projects you lead and projects of your teams"
                : "Projects of the teams you belong to"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | ProjectStatus)}
            className={`${inputClass} !w-auto`}
            aria-label="Filter by status"
          >
            <option value="ALL">All statuses</option>
            {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>

          {canCreate && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-indigo-400"
            >
              {showForm ? "Cancel" : "Create project"}
            </button>
          )}
        </div>
      </div>

      {canCreate && showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 max-w-2xl space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          {error && <p className={errorClass}>{error}</p>}

          <div>
            <label htmlFor="projectName" className={labelClass}>Project name</label>
            <input
              id="projectName"
              type="text"
              placeholder="Billing Platform"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="projectDescription" className={labelClass}>
              Description (optional)
            </label>
            <textarea
              id="projectDescription"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="priority" className={labelClass}>Priority</label>
              <select
                id="priority"
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
              <label htmlFor="startDate" className={labelClass}>Start date</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={dateInputClass}
              />
            </div>

            <div>
              <label htmlFor="dueDate" className={labelClass}>Due date</label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={dateInputClass}
              />
            </div>
          </div>

          <div>
            <p className={labelClass}>Linked teams</p>
            {creatableTeams.length === 0 ? (
              <p className="text-sm text-slate-400">
                {isAdmin
                  ? "Create a team first."
                  : "You do not lead any active team yet."}
              </p>
            ) : (
              <div className="space-y-2">
                {creatableTeams.map((t) => (
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
          </div>

          {isAdmin ? (
            <div>
              <label htmlFor="leader" className={labelClass}>Project lead</label>
              <select
                id="leader"
                value={effectiveLeaderId}
                onChange={(e) => setLeaderId(e.target.value)}
                disabled={leaderOptions.length === 0}
                className={inputClass}
              >
                <option value="">
                  {leaderOptions.length === 0
                    ? "Select a team with a Team Leader first"
                    : "Choose the project lead"}
                </option>
                {leaderOptions.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              You will be the project lead.
            </p>
          )}

          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? "Creating..." : "Create project"}
          </button>
        </form>
      )}

      {loading && <p className="mt-8 text-slate-400">Loading...</p>}
      {loadError && <p className={`${errorClass} mt-8`}>{loadError}</p>}

      {!loading && !loadError && visibleProjects.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          {projects.length === 0
            ? canCreate
              ? "No projects yet. Create your first project."
              : "There are no projects for your teams yet."
            : "No projects match this status."}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map((p) => (
          <Link
            key={p.id}
            to={`/projects/${p.id}`}
            className="block rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-indigo-500/50"
          >
            <h2 className="font-semibold">{p.name}</h2>

            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge status={p.status} />
              <PriorityBadge priority={p.priority} />
            </div>

            {p.description && (
              <p className="mt-3 line-clamp-2 text-sm text-slate-400">{p.description}</p>
            )}

            <div className="mt-4 space-y-1 text-sm text-slate-400">
              <p>
                Lead: <span className="text-slate-200">{p.teamLeader.name}</span>
              </p>
              <p>
                Teams:{" "}
                <span className="text-slate-200">
                  {p.teams.map((t) => t.team.name).join(", ")}
                </span>
              </p>
              <p>
                Due: <span className="text-slate-200">{formatDate(p.dueDate)}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}