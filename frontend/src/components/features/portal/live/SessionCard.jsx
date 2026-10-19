"use client";

import { Calendar, CalendarCheck, Clock, Mic, PlayCircle, Radio, Users } from "lucide-react";
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
  onOpenDetail,
  isBusy = false,
}) {
  const state = session.live_state;
  const isLive = state === "LIVE";
  const isEnded = state === "ENDED";
  const isCancelled = state === "CANCELLED";
  const countdown = formatCountdown(session.scheduled_at);
  const isFull = session.seats_remaining === 0 && !session.is_rsvped;

  return (
    <div
      className={`relative bg-paper border rounded-2xl shadow-sm p-5 flex flex-col gap-4 overflow-hidden transition-colors ${
        isLive ? "border-clay/40" : "border-line"
      } ${isCancelled ? "opacity-70" : ""}`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-80 ${
          isLive ? "from-clay via-rose to-clay" : "from-pine via-moss to-gold"
        }`}
      />

      <div className="flex items-start justify-between gap-3">
        <div
          className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
            isLive ? "bg-rose/35 text-clay border-clay/25" : "bg-gold/12 text-gold border-gold/25"
          }`}
        >
          {isLive ? <Radio className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {session.is_rsvped && !isEnded && !isCancelled && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border bg-sage/40 text-pine border-pine/20">
              <CalendarCheck className="w-3 h-3" />
              Going
            </span>
          )}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border shrink-0 ${
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
        <h3 className="text-base font-serif font-bold text-ink leading-snug group-hover:text-pine transition-colors">
          {session.title}
        </h3>
        {session.topic && (
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted mt-1">
            {session.topic}
          </p>
        )}
        {session.description && (
          <p className="text-xs text-muted font-light mt-1.5 leading-relaxed line-clamp-2">
            {session.description}
          </p>
        )}
      </button>

      {isCancelled && session.cancellation_reason && (
        <p className="text-xs text-clay font-light leading-relaxed">
          {session.cancellation_reason}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted font-light">
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
            <p className="text-[11px] text-muted font-light pl-[42px]">
              +{session.speakers.length - 2} more speaker
              {session.speakers.length - 2 === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-line flex items-center justify-between gap-3">
        <span className="text-[11px] text-muted font-light">
          {isLive
            ? "The room is open"
            : isEnded || isCancelled
              ? session.meeting_method_display
              : countdown || "Starting soon"}
        </span>

        {isEnded || isCancelled ? (
          session.recording_url ? (
            <a
              href={session.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg border border-line text-ink hover:bg-porcelain transition"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Recording
            </a>
          ) : (
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
              {isCancelled ? "Cancelled" : "No recording"}
            </span>
          )
        ) : isLive && !session.can_join ? (
          // Live right now, but the admin hasn't published a link yet —
          // offering "Save my spot" here would be nonsense.
          <span className="text-[11px] font-mono uppercase tracking-wider text-clay">
            Link coming soon
          </span>
        ) : session.can_join ? (
          <button
            type="button"
            onClick={() => onJoin?.(session)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg bg-clay hover:bg-clay/90 text-paper shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            Join Live
          </button>
        ) : session.is_rsvped ? (
          <button
            type="button"
            onClick={() => onCancelRsvp?.(session)}
            disabled={isBusy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg border border-line text-muted hover:text-ink hover:bg-porcelain transition disabled:opacity-50 cursor-pointer"
          >
            Cancel RSVP
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onRsvp?.(session)}
            disabled={isBusy || isFull}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg shadow-sm transition ${
              isFull
                ? "bg-porcelain text-muted cursor-not-allowed"
                : "bg-pine hover:bg-moss text-paper cursor-pointer disabled:opacity-50"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            {isFull ? "Full" : "Save my spot"}
          </button>
        )}
      </div>
    </div>
  );
}
