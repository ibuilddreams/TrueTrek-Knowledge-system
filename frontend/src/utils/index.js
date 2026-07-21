/**
 * Generic helpers that are not domain-specific.
 */

export function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function resolveUpdater(valueOrFn, previous) {
  return typeof valueOrFn === "function" ? valueOrFn(previous) : valueOrFn;
}

export function safeJsonParse(value, fallback = null) {
  if (value == null || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
