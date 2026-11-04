"use client";

import { LogIn, Video } from "lucide-react";
import { formatCountdown } from "./classSessionUtils";

/**
 * The one button that opens a classroom.
 *
 * Whether it works is `session.can_join`, which the server answers for this
 * particular viewer and from its own clock — both doors stand at the
 * scheduled start today, but they are two separate constants and a card that
 * re-derived either from the browser's clock would be wrong the day one of
 * them moves. `useClassSessionDoor` is what re-asks the server on the stroke
 * of that door, so the countdown below becomes a button at the advertised
 * time rather than at the list's next poll.
 */
export default function ClassSessionJoinButton({ session, onJoin, isBusy = false }) {
  const state = session.live_state;

  if (state === "ENDED" || state === "CANCELLED") return null;

  if (!session.can_join) {
    return (
      <span className="px-4 py-2 rounded-xl border border-line text-[11px] font-mono uppercase tracking-wider text-muted">
        {formatCountdown(session.join_opens_at)
          ? `Opens ${formatCountdown(session.join_opens_at)}`
          : "Opening shortly"}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onJoin?.(session)}
      disabled={isBusy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pine hover:bg-moss text-paper font-bold font-mono text-[11px] uppercase tracking-wider shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
    >
      {session.is_host ? <Video className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
      {session.is_host ? "Start class" : "Join class"}
    </button>
  );
}
