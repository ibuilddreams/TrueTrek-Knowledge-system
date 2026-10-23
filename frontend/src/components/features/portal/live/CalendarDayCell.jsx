"use client";

import { formatSessionTime, LIVE_STATE_DOT } from "./sessionUtils";

// Two chips is what fits a cell without the row growing taller than the rest
// of the month; anything past that is rolled into a "+N more" line and read in
// the agenda below.
const MAX_CHIPS = 2;
const MAX_DOTS = 4;

export default function CalendarDayCell({
  date,
  sessions = [],
  isCurrentMonth,
  isToday,
  isSelected,
  onSelect,
}) {
  const visible = sessions.slice(0, MAX_CHIPS);
  const overflow = sessions.length - visible.length;

  const summary =
    sessions.length === 0
      ? "no sessions"
      : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(date)}
      aria-pressed={isSelected}
      aria-current={isToday ? "date" : undefined}
      aria-label={`${date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })} — ${summary}`}
      className={`relative flex flex-col items-stretch gap-1 min-h-[62px] md:min-h-[92px] p-1.5 md:p-2 rounded-xl border text-left transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-1 ${
        isSelected
          ? "border-pine/40 bg-pine/[0.07] ring-1 ring-pine/25"
          : isCurrentMonth
            ? "border-line bg-paper hover:bg-porcelain"
            : "border-transparent bg-porcelain/40 hover:bg-porcelain"
      }`}
    >
      <span className="flex items-center justify-between gap-1">
        <span
          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-semibold shrink-0 ${
            isToday
              ? "bg-pine text-paper"
              : isCurrentMonth
                ? "text-ink"
                : "text-muted/45"
          }`}
        >
          {date.getDate()}
        </span>

        {/* Below md the cell is too narrow for chips, so the day's sessions
            collapse to dots and the agenda panel carries the detail. */}
        {sessions.length > 0 && (
          <span className="flex md:hidden items-center gap-0.5">
            {sessions.slice(0, MAX_DOTS).map((session) => (
              <span
                key={session.id}
                className={`w-1.5 h-1.5 rounded-full ${
                  LIVE_STATE_DOT[session.live_state] || LIVE_STATE_DOT.UPCOMING
                }`}
              />
            ))}
          </span>
        )}
      </span>

      {sessions.length > 0 && (
        <span className="hidden md:flex flex-col gap-1 min-w-0">
          {visible.map((session) => (
            <span
              key={session.id}
              title={`${formatSessionTime(session.scheduled_at)} · ${session.title}`}
              className={`flex items-stretch gap-1.5 pl-1 pr-1.5 py-1 rounded-md border min-w-0 ${
                session.is_rsvped && session.live_state !== "ENDED"
                  ? "bg-sage/40 border-pine/15"
                  : "bg-porcelain border-line"
              }`}
            >
              <span
                className={`w-1 rounded-full shrink-0 ${
                  LIVE_STATE_DOT[session.live_state] || LIVE_STATE_DOT.UPCOMING
                }`}
              />
              <span className="flex flex-col min-w-0 leading-tight">
                <span className="text-[9px] font-mono uppercase tracking-wide text-muted">
                  {formatSessionTime(session.scheduled_at)}
                </span>
                <span className="text-[11px] text-ink font-light line-clamp-2">
                  {session.title}
                </span>
              </span>
            </span>
          ))}

          {overflow > 0 && (
            <span className="text-[10px] font-mono text-muted pl-1.5">+{overflow} more</span>
          )}
        </span>
      )}
    </button>
  );
}
