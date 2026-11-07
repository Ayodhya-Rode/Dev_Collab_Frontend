import { Link } from "react-router-dom";
import { formatDate } from "../../lib/project";
import type { DashboardProject } from "../../types";
import { StatusBadge } from "../ProjectBadges";

const th = "px-3 py-2 text-xs font-medium text-slate-400";
const num = "px-3 py-3 text-center text-sm";

interface ProjectsTableProps {
  projects: DashboardProject[];
  emptyText: string;
}

export default function ProjectsTable({ projects, emptyText }: ProjectsTableProps) {
  if (projects.length === 0) {
    return <p className="text-sm text-slate-400">{emptyText}</p>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead className="border-b border-slate-800">
            <tr>
              <th className={th}>Project</th>
              <th className={th}>Teams</th>
              <th className={th}>Team Leader</th>
              <th className={th}>Status</th>
              <th className={th}>Progress</th>
              <th className={`${th} text-center`}>Total</th>
              <th className={`${th} text-center`}>Pending</th>
              <th className={`${th} text-center`}>Overdue</th>
              <th className={`${th} text-center`}>Completed</th>
              <th className={th}>Deadline</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800">
            {projects.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-3 text-sm">
                  <Link
                    to={`/projects/${p.id}`}
                    className="font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-sm text-slate-300">
                  {p.teams.map((t) => t.name).join(", ")}
                </td>
                <td className="px-3 py-3 text-sm text-slate-300">{p.teamLeader.name}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-indigo-500"
                        style={{ width: `${p.stats.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300">{p.stats.progress}%</span>
                  </div>
                </td>
                <td className={num}>{p.stats.total}</td>
                <td className={`${num} text-amber-300`}>{p.stats.pending}</td>
                <td
                  className={`${num} ${
                    p.stats.overdue > 0 ? "font-semibold text-red-300" : "text-slate-400"
                  }`}
                >
                  {p.stats.overdue}
                </td>
                <td className={`${num} text-emerald-300`}>{p.stats.completed}</td>
                <td className="px-3 py-3 text-sm text-slate-300">{formatDate(p.dueDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Pending means not completed, so it includes the overdue tasks. Counts are per
        project.
      </p>
    </div>
  );
}