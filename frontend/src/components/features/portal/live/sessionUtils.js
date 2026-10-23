// Shared formatting for session cards. The backend already decides a
// session's UPCOMING/LIVE/ENDED state (live_sessions/services.py::live_state)
// — these helpers only present it, so the client never re-derives a state the
// server is authoritative on.

export const LIVE_STATE_TONE = {
  LIVE: "bg-rose/35 text-clay border-clay/25",
  UPCOMING: "bg-gold/12 text-gold border-gold/25",
  ENDED: "bg-porcelain text-muted border-line",
  CANCELLED: "bg-porcelain text-muted border-line",
};

// Solid fill for the small square/dot that marks a session on the calendar
// grid, where a tinted badge would be too faint to read at 6px.
export const LIVE_STATE_DOT = {
  LIVE: "bg-clay",
  UPCOMING: "bg-gold",
  ENDED: "bg-muted/70",
  CANCELLED: "bg-muted/50",
};

export const LIVE_STATE_LABEL = {
  LIVE: "Live now",
  UPCOMING: "Upcoming",
  ENDED: "Ended",
  CANCELLED: "Cancelled",
};

export function formatSessionDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatSessionTime(isoString) {
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
