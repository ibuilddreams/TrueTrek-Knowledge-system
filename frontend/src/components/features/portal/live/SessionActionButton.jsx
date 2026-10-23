"use client";

import { CalendarCheck, PlayCircle, Radio } from "lucide-react";

// The one place that decides what a student can do with a session right now.
// Both the session cards and the calendar's day agenda render it, so the two
// surfaces can never drift into offering different actions for the same row.
//
// `can_join` is the server's word (live_sessions/services.py::can_join) and
// already folds in "is the room open" and "is there a link at all" — the
// branches below only present it.
export default function SessionActionButton({
  session,
  onRsvp,
  onCancelRsvp,
  onJoin,
  isBusy = false,
  size = "base",
}) {
  const state = session.live_state;
  const isLive = state === "LIVE";
  const isEnded = state === "ENDED";
  const isCancelled = state === "CANCELLED";
  const isFull = session.seats_remaining === 0 && !session.is_rsvped;

  const pad = size === "sm" ? "px-3 py-1.5" : "px-4 py-2";
  const padWide = size === "sm" ? "px-3.5 py-1.5" : "px-5 py-2";
  const base = `inline-flex items-center gap-1.5 ${
    size === "sm" ? "text-[11px]" : "text-xs"
  } font-semibold font-mono uppercase tracking-wider rounded-lg transition`;

  if (isEnded || isCancelled) {
    if (session.recording_url) {
      return (
        <a
          href={session.recording_url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} ${pad} border border-line text-ink hover:bg-porcelain`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          Recording
        </a>
      );
    }
    return (
      <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
        {isCancelled ? "Cancelled" : "No recording"}
      </span>
    );
  }

  // Live right now, but the admin hasn't published a link yet — offering
  // "Save my spot" here would be nonsense.
  if (isLive && !session.can_join) {
    return (
      <span className="text-[11px] font-mono uppercase tracking-wider text-clay">
        Link coming soon
      </span>
    );
  }

  if (session.can_join) {
    return (
      <button
        type="button"
        onClick={() => onJoin?.(session)}
        disabled={isBusy}
        className={`${base} ${padWide} bg-clay hover:bg-clay/90 text-paper shadow-sm disabled:opacity-50 cursor-pointer`}
      >
        <Radio className="w-3.5 h-3.5" />
        Join Live
      </button>
    );
  }

  if (session.is_rsvped) {
    return (
      <button
        type="button"
        onClick={() => onCancelRsvp?.(session)}
        disabled={isBusy}
        className={`${base} ${pad} border border-line text-muted hover:text-ink hover:bg-porcelain disabled:opacity-50 cursor-pointer`}
      >
        Cancel RSVP
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onRsvp?.(session)}
      disabled={isBusy || isFull}
      className={`${base} ${padWide} shadow-sm ${
        isFull
          ? "bg-porcelain text-muted cursor-not-allowed"
          : "bg-pine hover:bg-moss text-paper cursor-pointer disabled:opacity-50"
      }`}
    >
      <CalendarCheck className="w-3.5 h-3.5" />
      {isFull ? "Full" : "Save my spot"}
    </button>
  );
}
