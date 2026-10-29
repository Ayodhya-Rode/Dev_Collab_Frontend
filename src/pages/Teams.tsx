import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import type { TeamSummary } from "../types";
import { buttonClass, errorClass, inputClass, labelClass } from "../components/ui";
import toast from "react-hot-toast";


export default function Teams() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTeams = useCallback(async () => {
    try {
      const res = await api.get("/teams");
      setTeams(res.data.teams);
      setLoadError("");
    } catch {
      setLoadError("Could not load teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Team name is required");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/teams", { name, description });
      setName("");
      setDescription("");
      setShowForm(false);
      await loadTeams();
      toast.success("Team created successfully");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? "Could not create the team");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="mt-1 text-sm text-slate-400">
            {isAdmin
              ? "All teams in your organization"
              : "Teams you belong to"}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:cursor-pointer hover:bg-indigo-400"
          >
            {showForm ? "Cancel" : "Create team"}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 max-w-lg space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          {error && <p className={errorClass}>{error}</p>}

          <div>
            <label htmlFor="teamName" className={labelClass}>
              Team name
            </label>
            <input
              id="teamName"
              type="text"
              placeholder="Backend Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="teamDescription" className={labelClass}>
              Description (optional)
            </label>
            <textarea
              id="teamDescription"
              rows={3}
              placeholder="What does this team work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </div>

          <button type="submit" disabled={submitting} className={buttonClass}>
            {submitting ? "Creating..." : "Create team"}
          </button>
        </form>
      )}

      {loading && <p className="mt-8 text-slate-400">Loading...</p>}
      {loadError && <p className={`${errorClass} mt-8`}>{loadError}</p>}

      {!loading && !loadError && teams.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-400">
          {isAdmin
            ? "No teams yet. Create your first team to get started."
            : "You are not part of any team yet."}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="block rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-indigo-500/50"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{team.name}</h2>
              {team.status === "INACTIVE" && (
                <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                  Inactive
                </span>
              )}
            </div>

            {team.description && (
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                {team.description}
              </p>
            )}

            <div className="mt-4 space-y-1 text-sm text-slate-400">
              <p>
                Leader:{" "}
                <span className="text-slate-200">
                  {team.teamLeader ? team.teamLeader.name : "Not assigned"}
                </span>
              </p>
              <p>
                Members:{" "}
                <span className="text-slate-200">{team._count.members}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}