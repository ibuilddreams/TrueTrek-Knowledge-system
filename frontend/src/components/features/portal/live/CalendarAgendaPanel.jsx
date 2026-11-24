"use client";

import { CalendarDays } from "lucide-react";
import CalendarSessionRow from "./CalendarSessionRow";
import { formatDayHeading } from "./calendarUtils";

// What's on the day the student picked in the grid. It sits under the
// calendar at full width rather than beside it, so the month keeps room for
// readable chips and a day with two sessions still lays them out side by side.
export default function CalendarAgendaPanel({
  date,
  sessions = [],
  onRsvp,
  onCancelRsvp,
  onJoin,
  onOpenNotes,
  onOpenDetail,
  isBusy = false,
}) {
  return (
    <div className="bg-cn-p-card border border-cn-p-line rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-cn-p-line">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cn-p-accent/[0.07] border border-cn-p-accent-soft text-cn-p-accent flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-cn-p-ink truncate">
              {formatDayHeading(date)}
            </h3>
            <p className="text-[11px] text-cn-p-ink-2 font-light mt-0.5">
              {sessions.length === 0
                ? "Nothing scheduled"
                : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </div>

      {sessions.length === 0 ? (
        <p className="text-xs text-cn-p-ink-2 font-light leading-relaxed py-2">
          No War Room Live session on this day. Pick another date, or jump to the next month —
          sessions are announced monthly.
        </p>
      ) : (
        // A lone session keeps the full width rather than sitting in a
        // half-width column with the other half blank.
        <div
          className={`grid gap-3 ${sessions.length > 1 ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}
        >
          {sessions.map((session) => (
            <CalendarSessionRow
              key={session.id}
              session={session}
              onRsvp={onRsvp}
              onCancelRsvp={onCancelRsvp}
              onJoin={onJoin}
              onOpenDetail={onOpenDetail}
              isBusy={isBusy}
            />
          ))}
        </div>
      )}
    </div>
  );
}
