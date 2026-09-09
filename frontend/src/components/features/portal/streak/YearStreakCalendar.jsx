"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { formatPlainDate } from "@/lib/adminFormatters";

const CELL_SIZE = 13;
const CELL_GAP = 3;
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const WEEKDAY_ROW_LABELS = [{ row: 1, label: "Mon" }, { row: 3, label: "Wed" }, { row: 5, label: "Fri" }];

// Task 16 (Phase 5) follow-up — a GitHub-style year contribution grid for
// daily_drill.services.get_streak_calendar's `days` array. `days` is
// guaranteed by the backend to start on a Sunday and be laid out so that
// every 7-day chunk starting at index 0 is exactly one calendar week — this
// component never has to compute a day-of-week itself, it only reads the
// `weekday` field the backend already attached to each entry.
export default function YearStreakCalendar({ days, isVault }) {
  const totalWeeks = Math.ceil(days.length / 7);
  const scrollContainerRef = useRef(null);

  // The grid is laid out oldest -> newest (left -> right), so a full year
  // is much wider than the visible card and the browser starts scrolled to
  // the left by default — showing a year-old, inevitably-empty month first
  // and hiding today (and any recent activity) off-screen to the right.
  // Jump straight to the current date on load, matching GitHub's own
  // contribution graph, which always opens with today already in view.
  useLayoutEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) return;
    node.scrollLeft = node.scrollWidth;
  }, [days]);

  const monthLabels = useMemo(() => {
    const labels = [];
    let lastMonth = null;
    for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
      const firstDayOfWeek = days[weekIndex * 7];
      if (!firstDayOfWeek) continue;
      const month = firstDayOfWeek.date.slice(5, 7);
      if (month !== lastMonth) {
        labels.push({ weekIndex, label: MONTH_ABBR[Number(month) - 1] });
        lastMonth = month;
      }
    }
    return labels;
  }, [days, totalWeeks]);

  const gridStyle = {
    gridTemplateRows: `${CELL_SIZE}px repeat(7, ${CELL_SIZE}px)`,
    gridAutoFlow: "column",
    gridAutoColumns: `${CELL_SIZE}px`,
    columnGap: `${CELL_GAP}px`,
    rowGap: `${CELL_GAP}px`,
  };

  return (
    <div className="flex items-start gap-2">
      <div
        className="hidden sm:grid shrink-0"
        style={{ gridTemplateRows: `${CELL_SIZE}px repeat(7, ${CELL_SIZE}px)`, rowGap: `${CELL_GAP}px` }}
      >
        {WEEKDAY_ROW_LABELS.map(({ row, label }) => (
          <span
            key={label}
            style={{ gridRow: row + 2 }}
            className={`text-[10px] font-mono leading-none flex items-center ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      <div ref={scrollContainerRef} className="overflow-x-auto pb-1">
        <div className="inline-grid" style={gridStyle}>
          {monthLabels.map(({ weekIndex, label }) => (
            <span
              key={`${weekIndex}-${label}`}
              style={{ gridRow: 1, gridColumn: weekIndex + 1 }}
              className={`text-[10px] font-mono leading-none whitespace-nowrap ${
                isVault ? "text-stone-500" : "text-stone-400"
              }`}
            >
              {label}
            </span>
          ))}

          {days.map((day, index) => {
            const weekIndex = Math.floor(index / 7);
            return (
              <div
                key={day.date}
                style={{ gridRow: day.weekday + 2, gridColumn: weekIndex + 1 }}
                title={`${formatPlainDate(day.date)} — ${day.completed ? "Completed" : "Missed"}`}
                className={`rounded-[3px] border transition-colors ${
                  day.completed
                    ? isVault
                      ? "bg-amber-500 border-amber-400"
                      : "bg-amber-500 border-amber-600"
                    : isVault
                      ? "bg-white/5 border-stone-800"
                      : "bg-stone-100 border-stone-200"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
