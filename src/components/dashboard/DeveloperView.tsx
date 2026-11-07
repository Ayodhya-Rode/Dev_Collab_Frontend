import { Link } from "react-router-dom";
import { PRIORITY_CLASSES, PRIORITY_LABELS } from "../../lib/project";
import { formatDueDate, TASK_STATUS_LABELS } from "../../lib/task";
import type { DeveloperDashboard } from "../../types";
import StatTile from "../StatTile";
import { DonutChart, TASK_STATUS_COLORS } from "./DashboardCharts";
import Panel from "./Panel";
import ProjectsTable from "./ProjectsTable";

interface DeveloperViewProps {
  data: DeveloperDashboard;
}

export default function DeveloperView({ data }: DeveloperViewProps) {
  const { summary, charts, projects, upcomingDeadlines } = data;

  const statusData = charts.myTasksByStatus.map((d) => ({
    name: TASK_STATUS_LABELS[d.status],
    value: d.count,
    color: TASK_STATUS_COLORS[d.status],
  }));

  return (
    <div className="space-y-6">
      {data.teams.length === 0 && (
        <p className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300">
          You are not part of any team yet, so there is nothing to show.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="My tasks" value={summary.myTasks} />
        <StatTile label="In progress" value={summary.inProgress} tone="text-sky-300" />
        <StatTile label="Completed" value={summary.completed} tone="text-emerald-300" />
        <StatTile label="Overdue" value={summary.overdue} tone="text-red-300" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="My tasks by status">
          <DonutChart data={statusData} emptyText="No tasks assigned to you" />
        </Panel>

        <Panel title="Deadlines" subtitle="Overdue and due in the next 7 days.">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming deadlines.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {upcomingDeadlines.map((t) => (
                <li key={t.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${t.project.id}`}
                      className="block truncate text-sm font-medium text-indigo-300 hover:text-indigo-200"
                    >
                      {t.title}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {t.project.name} · {TASK_STATUS_LABELS[t.status]}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className={`text-xs ${t.isOverdue ? "text-red-300" : "text-slate-300"}`}>
                      {formatDueDate(t.dueDate)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.isOverdue ? "bg-red-500/15 text-red-300" : PRIORITY_CLASSES[t.priority]
                      }`}
                    >
                      {t.isOverdue ? "Overdue" : PRIORITY_LABELS[t.priority]}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="My projects" subtitle="Progress counts are for the whole project.">
        <ProjectsTable projects={projects} emptyText="No projects for the selected team." />
      </Panel>

      <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        Notifications will appear here.
      </div>
    </div>
  );
}