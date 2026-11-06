"use client";

import { useEffect, useRef } from "react";

/**
 * Warns the room that a class is nearly over, then closes it on the hour.
 *
 * A class booked for an hour is over after an hour: the server shuts its door
 * at `ends_at` (`class_sessions/services.py::LIVE_GRACE_MINUTES_AFTER`, which
 * is zero), so a classroom left open past it is a room nobody can rejoin, a
 * card that says the class has ended, and — for the teacher — a set of notes
 * that never starts being written. This closes it instead.
 *
 * Three things here are deliberate.
 *
 * **Nobody is cut off without notice.** The warnings fire at five minutes and
 * one minute, and only the ones still in the future are armed — somebody who
 * joins with thirty seconds left gets the close, not a warning about five
 * minutes that have already gone.
 *
 * **The close goes through the classroom's own leave.** It is the same path
 * as the red button, so the teacher's last audio is flushed, the notes are
 * finished and the register is stamped exactly as they would be if they had
 * pressed it themselves. Nothing here talks to the server directly.
 *
 * **Each moment fires once.** The effect re-runs whenever the session payload
 * refreshes (a poll every minute, each one a new object), and a `Set` of the
 * moments already passed is what stops the five-minute warning appearing five
 * times. Re-keyed on the class and its end time, so a rescheduled class warns
 * again about its new ending.
 *
 * The clock is the browser's, as it is everywhere else a time is rendered
 * here (`useClassSessionDoor`, `formatCountdown`). The server is still the
 * authority — it refuses a rejoin past the end whatever this does — so a
 * badly-set clock costs a warning at the wrong moment, not access.
 */

// setTimeout keeps its delay in a signed 32-bit int and anything longer fires
// immediately. A classroom is never open that far ahead of its end, but a
// nonsense `ends_at` must not slam the door the instant somebody walks in.
const MAX_TIMER_MS = 2_147_483_000;

// How long before the end each warning lands, and what it says. Order is
// descending so the list reads like the clock does.
export const CLOSING_WARNINGS = [
  { key: "5m", msBefore: 5 * 60_000, message: "This class ends in 5 minutes." },
  { key: "1m", msBefore: 60_000, message: "This class ends in 1 minute." },
];

export function useClassroomClosing({
  endsAt,
  enabled = true,
  onWarn,
  onClose,
} = {}) {
  // Read through refs so a re-render with new callbacks never re-arms the
  // timers — the only things that should do that are the class and its end.
  const warnRef = useRef(onWarn);
  const closeRef = useRef(onClose);
  const firedRef = useRef(new Set());

  useEffect(() => {
    warnRef.current = onWarn;
    closeRef.current = onClose;
  }, [onWarn, onClose]);

  useEffect(() => {
    firedRef.current = new Set();
  }, [endsAt]);

  useEffect(() => {
    if (!enabled || !endsAt) return undefined;

    const target = new Date(endsAt).getTime();
    if (Number.isNaN(target)) return undefined;

    const timers = [];
    const arm = (key, at, run) => {
      if (firedRef.current.has(key)) return;
      const delay = at - Date.now();
      // A moment already gone is not fired late — except the close itself,
      // which runs immediately, because a classroom open past its end is the
      // state this hook exists to end.
      if (delay > MAX_TIMER_MS) return;
      if (delay <= 0 && key !== "close") return;
      timers.push(
        setTimeout(
          () => {
            if (firedRef.current.has(key)) return;
            firedRef.current.add(key);
            run();
          },
          Math.max(0, delay),
        ),
      );
    };

    CLOSING_WARNINGS.forEach(({ key, msBefore, message }) => {
      arm(key, target - msBefore, () => warnRef.current?.(message));
    });
    arm("close", target, () => closeRef.current?.());

    return () => timers.forEach(clearTimeout);
  }, [enabled, endsAt]);
}

export default useClassroomClosing;
