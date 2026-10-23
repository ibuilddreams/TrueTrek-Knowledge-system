// Month-grid maths for the War Room Live calendar.
//
// Everything here works in the viewer's own timezone, exactly like the
// formatters in sessionUtils: the server only ever speaks UTC (see
// live_sessions/services.py), so a session has to be placed on the day the
// student themselves would say it falls on, not the day it falls on in UTC.
//
// No date library is in the frontend's dependencies, and this is the only
// screen that needs calendar arithmetic — native Date is enough for it.

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Milliseconds for a date-ish value, or null when there isn't one.
 *
 * The falsy guard is load-bearing: `new Date(null)` is not an invalid date, it
 * is the epoch — without it a session missing a `scheduled_at` would quietly
 * be filed under 1 January 1970 rather than dropped.
 */
function toTimestamp(value) {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** "2026-11-03" in local time — the key both the grid and the groupings use. */
export function toDayKey(value) {
  const time = toTimestamp(value);
  if (time === null) return null;

  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatMonthLabel(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function formatDayHeading(date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/**
 * Weeks of seven days covering `monthDate`, padded out with the neighbouring
 * months' days so every row is full. Only as many rows as the month actually
 * needs (4-6), so February doesn't leave an empty band under the grid.
 */
export function buildMonthWeeks(monthDate) {
  const first = startOfMonth(monthDate);
  const leading = first.getDay();
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const weekCount = Math.ceil((leading + daysInMonth) / 7);

  const weeks = [];
  for (let week = 0; week < weekCount; week += 1) {
    const days = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      days.push(
        // Day-of-month arithmetic rolls over month and year boundaries on its
        // own, so the leading/trailing cells need no special casing.
        new Date(first.getFullYear(), first.getMonth(), 1 - leading + week * 7 + weekday),
      );
    }
    weeks.push(days);
  }
  return weeks;
}

/**
 * `Map` of day key -> that day's sessions, earliest start first.
 *
 * The upcoming and past querysets are disjoint server-side, but they arrive as
 * two lists and are concatenated by the caller, so ids are de-duplicated here
 * rather than trusting that to stay true.
 */
export function groupSessionsByDay(sessions) {
  const byDay = new Map();
  const seen = new Set();

  (sessions || []).forEach((session) => {
    if (!session || seen.has(session.id)) return;
    const key = toDayKey(session.scheduled_at);
    if (!key) return;
    seen.add(session.id);

    const bucket = byDay.get(key);
    if (bucket) bucket.push(session);
    else byDay.set(key, [session]);
  });

  byDay.forEach((bucket) => {
    bucket.sort((a, b) => toTimestamp(a.scheduled_at) - toTimestamp(b.scheduled_at));
  });

  return byDay;
}

/**
 * The day the calendar should open on: the next session that hasn't started
 * yet, falling back to the most recent one and then to today. Opening on an
 * empty current month would hide the very thing the calendar is here to show.
 */
export function findFocusDate(sessions) {
  const now = Date.now();
  let next = null;
  let latestPast = null;

  (sessions || []).forEach((session) => {
    const startedAt = toTimestamp(session?.scheduled_at);
    if (startedAt === null) return;

    if (startedAt >= now) {
      if (next === null || startedAt < next) next = startedAt;
    } else if (latestPast === null || startedAt > latestPast) {
      latestPast = startedAt;
    }
  });

  const chosen = next ?? latestPast;
  return chosen === null ? null : new Date(chosen);
}
