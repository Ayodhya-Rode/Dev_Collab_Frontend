import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectStatus, TaskStatus } from "../../types";

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: "#38bdf8",
  ACTIVE: "#34d399",
  ON_HOLD: "#fbbf24",
  COMPLETED: "#818cf8",
  ARCHIVED: "#64748b",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#38bdf8",
  IN_REVIEW: "#fbbf24",
  COMPLETED: "#34d399",
};

const tooltipProps = {
  contentStyle: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    color: "#e2e8f0",
  },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#94a3b8" },
};

const legendFormatter = (value: string | number) => (
  <span style={{ color: "#cbd5e1", fontSize: 12 }}>{value}</span>
);

const shorten = (value: string) => (value.length > 16 ? `${value.slice(0, 15)}…` : value);

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-400">
      {text}
    </div>
  );
}

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

export function DonutChart({ data, emptyText }: { data: DonutDatum[]; emptyText: string }) {
  const visible = data.filter((d) => d.value > 0);

  if (visible.length === 0) return <EmptyChart text={emptyText} />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={visible}
          dataKey="value"
          nameKey="name"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={2}
          stroke="none"
        >
          {visible.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip {...tooltipProps} />
        <Legend formatter={legendFormatter} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export interface StackedDatum {
  name: string;
  completed?: number;
  onTrack: number;
  overdue: number;
}

interface StackedBarsProps {
  data: StackedDatum[];
  showCompleted: boolean;
  emptyText: string;
}

export function StackedBars({ data, showCompleted, emptyText }: StackedBarsProps) {
  if (data.length === 0) return <EmptyChart text={emptyText} />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44 + 70)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid stroke="#1e293b" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          stroke="#334155"
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tickFormatter={shorten}
          tick={{ fill: "#cbd5e1", fontSize: 12 }}
          stroke="#334155"
        />
        <Tooltip {...tooltipProps} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
        <Legend formatter={legendFormatter} />
        {showCompleted && (
          <Bar dataKey="completed" name="Completed" stackId="tasks" fill="#34d399" />
        )}
        <Bar dataKey="onTrack" name="Pending (on track)" stackId="tasks" fill="#38bdf8" />
        <Bar dataKey="overdue" name="Overdue" stackId="tasks" fill="#f87171" />
      </BarChart>
    </ResponsiveContainer>
  );
}