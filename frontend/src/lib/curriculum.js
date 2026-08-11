export function formatDurationMinutes(minutes) {
  const total = Number(minutes) || 0;
  if (total <= 0) return "Self-paced";
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours <= 0) return `${mins}m`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function getInitials(title) {
  return (title || "C")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
