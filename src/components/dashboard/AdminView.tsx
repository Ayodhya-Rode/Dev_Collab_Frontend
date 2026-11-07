import { STATUS_LABELS } from "../../lib/project";
import type { AdminDashboard } from "../../types";
import StatTile from "../StatTile";
import { DonutChart, PROJECT_STATUS_COLORS, StackedBars } from "./DashboardCharts";
import Panel from "./Panel";
import ProjectsTable from "./ProjectsTable";

export default function AdminView({ data }: { data: AdminDashboard }) {
  const { summary, charts, projects } = data;

  const statusData = charts.projectsByStatus.map((d) => ({
    name: STATUS_LABELS[d.status],
    value: d.count,
    color: PROJECT_STATUS_COLORS[d.status],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Total teams" value={summary.totalTeams} />
        <StatTile label="Total employees" value={summary.totalEmployees} />
        <StatTile label="Total projects" value={summary.totalProjects} />
        <StatTile
          label="Completed projects"
          value={summary.completedProjects}
          tone="text-emerald-300"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Projects by status" subtitle="Archived projects are not counted.">
          <DonutChart data={statusData} emptyText="No projects yet" />
        </Panel>

        <Panel title="Tasks per project" subtitle="Completed, pending on track, and overdue.">
          <StackedBars
            data={charts.tasksByProject}
            showCompleted
            emptyText="No tasks yet"
          />
        </Panel>
      </div>

      <Panel title="Projects">
        <ProjectsTable projects={projects} emptyText="No projects yet." />
      </Panel>
    </div>
  );
}