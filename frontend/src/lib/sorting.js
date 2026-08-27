// Shared client-side sorting helpers for admin DataTable list screens.

// Cycles a column through asc -> desc -> unsorted, matching the click-to-sort
// convention used across the admin tabs (clicking a different column always
// starts it fresh at asc).
export function toggleSortConfig(current, key) {
  if (current?.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return { key: null, direction: null };
}

// Sorts `rows` by the value `accessors[sortConfig.key]` produces for each row.
// Strings compare case-insensitively (locale-aware, numeric-aware so "2" < "10");
// numbers and Dates compare by value. Nullish values always sort to the end,
// regardless of direction, so "no date"/"no value" doesn't jump to the top on desc.
function compareValues(a, b) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
}

export function sortRows(rows, sortConfig, accessors) {
  if (!sortConfig?.key) return rows;
  const accessor = accessors[sortConfig.key];
  if (!accessor) return rows;

  const direction = sortConfig.direction === "desc" ? -1 : 1;
  const withValues = rows.map((row) => ({ row, value: accessor(row) }));
  withValues.sort((a, b) => {
    if (a.value == null && b.value == null) return 0;
    if (a.value == null) return 1;
    if (b.value == null) return -1;
    return direction * compareValues(a.value, b.value);
  });

  return withValues.map(({ row }) => row);
}
