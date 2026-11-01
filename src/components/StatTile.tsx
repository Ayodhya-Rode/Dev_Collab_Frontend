interface StatTileProps {
  label: string;
  value: number;
  tone?: string;
}

export default function StatTile({ label, value, tone = "text-slate-100" }: StatTileProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}