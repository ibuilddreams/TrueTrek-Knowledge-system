/** Formatted ISO date string for N days ago (YYYY-MM-DD). */
export function getDaysAgoDateString(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

/** Days since a drill completion date string. */
export function getDaysSinceLastDrill(lastDrillDate) {
  if (!lastDrillDate) return 999;
  const drillDate = new Date(lastDrillDate);
  const today = new Date();
  drillDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - drillDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}
