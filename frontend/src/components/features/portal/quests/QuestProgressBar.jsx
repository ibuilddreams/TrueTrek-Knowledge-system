"use client";

export default function QuestProgressBar({ completed = 0, total = 0 }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[11px] font-mono uppercase tracking-widest text-muted">
          Today&apos;s Progress
        </span>
        <span className="text-[11px] font-mono text-muted tabular-nums">{percent}%</span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-porcelain overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Today's quest completion"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-pine to-moss transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
