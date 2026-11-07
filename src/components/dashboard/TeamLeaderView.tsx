import type { TeamLeaderDashboard } from "../../types";
import StatTile from "../StatTile";
import { StackedBars } from "./DashboardCharts";
import Panel from "./Panel";
import ProjectsTable from "./ProjectsTable";

export default function TeamLeaderView({ data }: { data: TeamLeaderDashboard }) {
  const { summary, charts, projects } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile label="Team members" value={summary.teamMembers} />
        <StatTile label="Teams you lead" value={summary.teamsLed} />
        <StatTile label="Total projects" value={summary.totalProjects} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Tasks per project" subtitle="Completed, pending on track, and overdue.">
          <StackedBars
            data={charts.tasksByProject}
            showCompleted
            emptyText="No tasks yet"
          />
        </Panel>

        <Panel
          title="Pending tasks per Developer"
          subtitle="Only the projects you lead."
        >
          <StackedBars
            data={charts.workload}
            showCompleted={false}
            emptyText="No pending tasks"
          />
        </Panel>
      </div>

      <Panel title="Projects">
        <ProjectsTable projects={projects} emptyText="No projects yet." />
      </Panel>
    </div>
  );
}