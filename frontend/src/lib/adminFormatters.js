export function formatActivityType(activityType) {
  if (!activityType) return "Activity";
  return activityType
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatDateTime(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}
