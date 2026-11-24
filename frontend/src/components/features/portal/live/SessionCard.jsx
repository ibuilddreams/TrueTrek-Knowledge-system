"use client";

import { Calendar, CalendarCheck, Clock, Mic, Radio, Users } from "lucide-react";
import SessionActionButton from "./SessionActionButton";
import SpeakerChip from "./SpeakerChip";
import {
  formatCountdown,
  formatSessionDate,
  formatSessionTime,
  LIVE_STATE_LABEL,
  LIVE_STATE_TONE,
} from "./sessionUtils";

export default function SessionCard({
  session,
  onRsvp,
  onCancelRsvp,
  onJoin,
  onOpenNotes,
  onOpenDetail,
  isBusy = false,
  flat = false,
}) {
  const state = session.live_state;
  const isLive = state === "LIVE";
  const isEnded = state === "ENDED";
  const isCancelled = state === "CANCELLED";
  const countdown = formatCountdown(session.scheduled_at);

  return (
    <div
      className={`relative p-5 flex flex-col gap-4 overflow-hidden transition-colors ${
        flat ? "" : "bg-cn-p-card border rounded-cn-p"
      } ${
        isLive ? "border-cn-p-bad-bg" : "border-cn-p-line"
      } ${isCancelled ? "opacity-70" : ""}`}
    >

      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
            isLive ? "bg-cn-p-bad-bg text-cn-p-bad border-cn-p-bad-bg" : "bg-cn-p-warn-bg text-cn-p-warn border-transparent"
          }`}
        >
          {isLive ? <Radio className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {session.is_rsvped && !isEnded && !isCancelled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border bg-cn-p-soft text-cn-p-soft-ink border-transparent">
              <CalendarCheck className="w-3 h-3" />
              Going
            </span>
          )}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
              LIVE_STATE_TONE[state] || LIVE_STATE_TONE.UPCOMING
            }`}
          >
            {LIVE_STATE_LABEL[state] || state}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail?.(session)}
        className="text-left min-w-0 cursor-pointer group"
      >
        <h3 className="text-base font-bold text-cn-p-ink leading-snug group-hover:text-cn-p-accent transition-colors">
          {session.title}
        </h3>
        {session.topic && (
          <p className="text-[11px] font-semibold text-cn-p-ink-2 mt-1">
            {session.topic}
          </p>
        )}
        {session.description && (
          <p className="text-xs text-cn-p-ink-2 font-light mt-1.5 leading-relaxed line-clamp-2">
            {session.description}
          </p>
        )}
      </button>

      {isCancelled && session.cancellation_reason && (
        <p className="text-xs text-cn-p-bad font-light leading-relaxed">
          {session.cancellation_reason}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-cn-p-ink-2 font-light">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3 h-3" />
          {formatSessionDate(session.scheduled_at)} · {formatSessionTime(session.scheduled_at)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {session.duration_minutes} min
        </span>
        {typeof session.rsvp_count === "number" && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            {session.rsvp_count} going
          </span>
        )}
      </div>

      {(session.speakers || []).length > 0 && (
        <div className="flex flex-col gap-2.5 pt-1">
          {session.speakers.slice(0, 2).map((speaker) => (
            <SpeakerChip key={speaker.id} speaker={speaker} />
          ))}
          {session.speakers.length > 2 && (
            <p className="text-[11px] text-cn-p-ink-2 font-light pl-[42px]">
              +{session.speakers.length - 2} more speaker
              {session.speakers.length - 2 === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-cn-p-line flex items-center justify-between gap-3">
        <span className="text-[11px] text-cn-p-ink-2 font-light">
          {isLive
            ? "The room is open"
            : isEnded || isCancelled
              ? session.meeting_method_display
              : countdown || "Starting soon"}
        </span>

        <SessionActionButton
          session={session}
          onRsvp={onRsvp}
          onCancelRsvp={onCancelRsvp}
          onJoin={onJoin}
          onOpenNotes={onOpenNotes}
          isBusy={isBusy}
        />
      </div>
    </div>
  );
}
