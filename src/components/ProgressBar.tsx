export default function ProgressBar({ value }: { value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>Progress</span>
        <span>{value}%</span>
      </div>
      <div
        className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}