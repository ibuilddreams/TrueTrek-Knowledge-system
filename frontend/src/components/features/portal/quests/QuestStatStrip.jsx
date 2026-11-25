"use client";

/**
 * The four-up stat readout at the top of the quest dashboard — the brief's
 * "progress tracking, completed quests, points, streaks" in one row.
 *
 * Mono/uppercase with large numerals rather than the portal's `StatCard`
 * (one card per stat) so the whole set reads as a single progress panel
 * above the task cards.
 */
export default function QuestStatStrip({ stats }) {
  const items = [
    { label: "Points today", value: (stats?.points_today ?? 0).toLocaleString() },
    {
      label: "Day streak",
      value: stats?.current_streak ?? 0,
    },
    {
      label: "Done today",
      value: `${stats?.completed_today ?? 0} / ${stats?.assigned_today ?? 0}`,
    },
    { label: "All time", value: (stats?.total_completed ?? 0).toLocaleString() },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl border border-cn-p-line bg-cn-p-page/60 divide-y divide-x divide-line sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3.5 text-center first:border-l-0">
          <p className="text-2xl sm:text-3xl font-bold text-cn-p-accent tracking-tight tabular-nums">
            {item.value}
          </p>
          <p className="text-[10px] font-semibold text-cn-p-ink-2 mt-1">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
