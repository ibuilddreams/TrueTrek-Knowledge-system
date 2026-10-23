"use client";

import { CalendarCheck, Clock, Users } from "lucide-react";
import SessionActionButton from "./SessionActionButton";
import {
  formatCountdown,
  formatSessionTime,
  LIVE_STATE_LABEL,
  LIVE_STATE_TONE,
} from "./sessionUtils";

// One session as it appears under the calendar, for a day the student picked.
// The date is already the panel's heading, so the row leads with the start
// time instead of repeating it.
export default function CalendarSessionRow({
  session,
  onRsvp,
  onCancelRsvp,
  onJoin,
  onOpenDetail,
  isBusy = false,
}) {
  const state = session.live_state;
  const isLive = state === "LIVE";
  const isEnded = state === "ENDED";
  const isCancelled = state === "CANCELLED";
  const countdown = formatCountdown(session.scheduled_at);

  return (
    <div
      className={`flex items-start gap-3.5 p-3.5 rounded-xl border bg-paper transition-colors ${
        isLive ? "border-clay/40" : "border-line"
      } ${isCancelled ? "opacity-70" : ""}`}
    >
      <div className="w-16 shrink-0 text-center pt-0.5">
        <p className="text-sm font-mono font-semibold text-ink leading-tight">
          {formatSessionTime(session.scheduled_at)}
        </p>
        <p className="inline-flex items-center gap-1 text-[10px] font-mono text-muted mt-1">
          <Clock className="w-2.5 h-2.5" />
          {session.duration_minutes}m
        </p>
      </div>

      <div className="w-px self-stretch bg-line" aria-hidden="true" />

      <div className="min-w-0 flex-1 flex flex-col gap-2">
        {/* Wraps on available space rather than on a viewport breakpoint: this
            row is narrow on a phone *and* in the two-column agenda a busy day
            renders, and a `sm:` rule would only fix the first of those. Below
            the title's min width the badges drop to their own line instead of
            squeezing the title to one word per line. */}
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
          <button
            type="button"
            onClick={() => onOpenDetail?.(session)}
            className="text-left flex-1 min-w-[150px] cursor-pointer group"
          >
            <p className="text-sm font-serif font-bold text-ink leading-snug group-hover:text-pine transition-colors">
              {session.title}
            </p>
            {session.topic && (
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted mt-0.5">
                {session.topic}
              </p>
            )}
          </button>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            {session.is_rsvped && !isEnded && !isCancelled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border bg-sage/40 text-pine border-pine/20">
                <CalendarCheck className="w-3 h-3" />
                Going
              </span>
            )}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border ${
                LIVE_STATE_TONE[state] || LIVE_STATE_TONE.UPCOMING
              }`}
            >
              {LIVE_STATE_LABEL[state] || state}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-3 text-[11px] text-muted font-light">
            {typeof session.rsvp_count === "number" && (
              <span className="inline-flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                {session.rsvp_count} going
              </span>
            )}
            <span>
              {isLive
                ? "The room is open"
                : isEnded || isCancelled
                  ? session.meeting_method_display
                  : countdown || "Starting soon"}
            </span>
          </span>

          <SessionActionButton
            session={session}
            onRsvp={onRsvp}
            onCancelRsvp={onCancelRsvp}
            onJoin={onJoin}
            isBusy={isBusy}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
}
