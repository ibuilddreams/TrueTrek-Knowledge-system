"use client";

export default function QuestProgressBar({ completed = 0, total = 0 }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[11px] font-semibold text-cn-p-ink-2">
          Today&apos;s progress
        </span>
        <span className="text-[11px] text-cn-p-ink-2 tabular-nums">{percent}%</span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-cn-p-page overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Today's quest completion"
      >
        <div
          className="h-full rounded-full bg-cn-p-accent transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
