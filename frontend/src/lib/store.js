export function formatCoursePrice(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return "Free";
  // The design prints whole prices without cents ("$180", never "$180.00"),
  // and every price in the catalog is a whole number of dollars. Cents are
  // still shown when a price actually has them, so a $19.99 course added
  // later reads correctly rather than being rounded away.
  const hasCents = !Number.isInteger(value);
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
