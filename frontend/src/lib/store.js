export function formatCoursePrice(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "Free";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
