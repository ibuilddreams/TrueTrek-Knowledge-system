export function formatActivityType(activityType) {
  if (!activityType) return "Activity";
  return activityType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toUsDateParts(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return null;
  return {
    month: pad2(date.getMonth() + 1),
    day: pad2(date.getDate()),
    year: date.getFullYear(),
    hours: date.getHours(),
    minutes: pad2(date.getMinutes()),
  };
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  const parts = toUsDateParts(isoString);
  if (!parts) return "—";
  return `${parts.month}/${parts.day}/${parts.year}`;
}

export function formatDateTime(isoString) {
  if (!isoString) return "";
  const parts = toUsDateParts(isoString);
  if (!parts) return "";
  const hour12 = parts.hours % 12 || 12;
  const meridiem = parts.hours >= 12 ? "PM" : "AM";
  return `${parts.month}/${parts.day}/${parts.year}, ${hour12}:${parts.minutes} ${meridiem}`;
}

// For a plain "YYYY-MM-DD" date (no time/timezone component — e.g. a
// scheduled session's calendar day), never round-trip through `new Date()`:
// a bare date string is parsed as UTC midnight, and formatting it back out
// via local-time getters (as formatDate/formatDateTime do, correctly, for
// real datetime instants) can shift it a day in timezones behind UTC. This
// formats the string's own digits directly instead.
export function formatPlainDate(isoDate) {
  if (!isoDate) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return "—";
  const [, year, month, day] = match;
  return `${month}/${day}/${year}`;
}

// For a plain "HH:MM[:SS]" time (no date/timezone component).
export function formatPlainTime(isoTime) {
  if (!isoTime) return "";
  const match = /^(\d{2}):(\d{2})/.exec(isoTime);
  if (!match) return "";
  const hours = Number(match[1]);
  const minutes = match[2];
  const hour12 = hours % 12 || 12;
  const meridiem = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${minutes} ${meridiem}`;
}

export function formatAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "Free";
  return `$${value.toFixed(2)}`;
}
