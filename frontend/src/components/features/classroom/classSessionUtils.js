// Presentation helpers for live classes, shared by the teacher portal and
// the student portal. The backend is authoritative on a class's
// UPCOMING/LIVE/ENDED state and on whether *this* viewer may join it
// (class_sessions/services.py::live_state / can_join_now) — nothing here
// re-derives either, it only formats what the API already decided.

export const CLASS_STATE_TONE = {
  LIVE: "bg-rose/35 text-clay border-clay/25",
  UPCOMING: "bg-gold/12 text-gold border-gold/25",
  ENDED: "bg-porcelain text-muted border-line",
  CANCELLED: "bg-porcelain text-muted border-line",
};

export const CLASS_STATE_LABEL = {
  LIVE: "Live now",
  UPCOMING: "Upcoming",
  ENDED: "Ended",
  CANCELLED: "Cancelled",
};

export function formatClassDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatClassTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "in 3 days" / "in 2 hours" / "in 12 min" — null once the moment has passed. */
export function formatCountdown(isoString) {
  if (!isoString) return null;
  const target = new Date(isoString).getTime();
  if (Number.isNaN(target)) return null;

  const diffMs = target - Date.now();
  if (diffMs <= 0) return null;

  const minutes = Math.round(diffMs / 60000);
  if (minutes < 60) return `in ${minutes} min`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? "" : "s"}`;

  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? "" : "s"}`;
}

/** The value a <input type="datetime-local"> expects, in local time. */
export function toDateTimeLocalValue(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

/** Initials for a participant tile with no video. */
export function getInitials(name) {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "?";
}

/**
 * Whether removing a class will cancel it rather than delete it.
 *
 * Mirrors the rule the server applies (class_sessions/views.py): a class that
 * anyone has joined, or that has already started, stays on the record with a
 * reason attached. Used only to word the button and the confirmation — the
 * server decides, and its own message is what the teacher is shown afterwards.
 */
export function willCancelRatherThanDelete(session) {
  if (!session) return false;
  return session.attendee_count > 0 || session.live_state !== "UPCOMING";
}
