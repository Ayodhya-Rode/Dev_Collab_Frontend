import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import AdminView from "../components/dashboard/AdminView";
import DeveloperView from "../components/dashboard/DeveloperView";
import TeamLeaderView from "../components/dashboard/TeamLeaderView";
import { useAuth } from "../context/AuthContext";
import { apiMessage } from "../lib/errors";
import type { DashboardData } from "../types";
import { errorClass, inputClass } from "../components/ui";

export default function Dashboard() {
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teamId, setTeamId] = useState("");
  const latest = useRef(0);

  const load = useCallback(async () => {
    // Only the newest request may update the page
    const requestId = ++latest.current;
    setLoading(true);

    try {
      const res = await api.get("/dashboard", {
        params: teamId ? { teamId } : {},
      });

      if (requestId !== latest.current) return;

      setData(res.data);
      setError("");
    } catch (err) {
      if (requestId !== latest.current) return;

      // The selected team is gone: go back to all teams
      if (teamId) {
        toast.error(apiMessage(err, "Could not load that team"));
        setTeamId("");
        return;
      }

      setError(apiMessage(err, "Could not load the dashboard"));
    } finally {
      if (requestId === latest.current) setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const developerData = data?.role === "DEVELOPER" ? data : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome, {user?.name}.{" "}
            {user?.role === "ADMIN" && "Your whole organization at a glance."}
            {user?.role === "TEAM_LEADER" && "Your teams and the projects you lead."}
            {user?.role === "DEVELOPER" && "Your tasks and your teams."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {developerData && developerData.teams.length > 0 && (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className={`${inputClass} !w-auto`}
              aria-label="Select a team"
            >
              <option value="">All my teams</option>
              {developerData.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:cursor-pointer hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {error && <p className={errorClass}>{error}</p>}

        {!data && loading && <p className="text-slate-400">Loading...</p>}

        {data?.role === "ADMIN" && <AdminView data={data} />}
        {data?.role === "TEAM_LEADER" && <TeamLeaderView data={data} />}
        {data?.role === "DEVELOPER" && <DeveloperView data={data} />}
      </div>
    </div>
  );
}