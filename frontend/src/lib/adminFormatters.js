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
