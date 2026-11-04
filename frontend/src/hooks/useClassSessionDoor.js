"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

// setTimeout keeps its delay in a signed 32-bit int, and anything longer
// fires immediately — a class weeks out is re-armed rather than trusted.
const MAX_TIMER_MS = 2_147_483_000;

// A browser's clock and the server's are never exactly in step. If the moment
// passes here while the server still says the room is shut, ask again shortly
// rather than waiting out the list's own minute-long poll.
const SKEW_RETRY_MS = 5_000;

/**
 * Re-asks the server the instant a class's door is due to open.
 *
 * Whether a room is open is answered per viewer, server-side, from the clock
 * (class_sessions/services.py::can_join_now) and nothing here re-derives it.
 * But the lists behind these cards only refetch once a minute, so a card left
 * on screen would go on counting down for up to a minute after the class was
 * due to start. This schedules one refetch for the stroke of `join_opens_at`,
 * which is what makes "Start class" and "Join class" appear at the advertised
 * time rather than at the next poll — and it moves the LIVE badge and the
 * room's status line with them, since all three come from that one payload.
 */
export function useClassSessionDoor(session) {
  const queryClient = useQueryClient();
  const [attempt, setAttempt] = useState(0);

  const opensAt = session?.join_opens_at;
  const canJoin = Boolean(session?.can_join);
  const state = session?.live_state;
  const isOver = state === "ENDED" || state === "CANCELLED";

  useEffect(() => {
    // Nothing to wait for: the door is already open, or the class is over.
    if (!opensAt || canJoin || isOver) return undefined;

    const target = new Date(opensAt).getTime();
    if (Number.isNaN(target)) return undefined;

    const remaining = target - Date.now();
    // A second past the door, so a browser running fractionally ahead of the
    // server doesn't ask the question just before it unlocks.
    const delay =
      remaining > 0 ? Math.min(remaining + 1000, MAX_TIMER_MS) : SKEW_RETRY_MS;

    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["class-sessions"] });
      // Re-arms this effect. Until the refetch comes back with the door open
      // (or the class over, which both end it above), this is the only thing
      // watching for the moment.
      setAttempt((value) => value + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [queryClient, opensAt, canJoin, isOver, attempt]);
}

export default useClassSessionDoor;
