// Shared helpers for "Amount ($)" text inputs across course-creation forms.

// Strips anything that isn't a digit or dot while typing, collapses multiple
// dots into one, caps decimals at 2 digits, and removes leading zeros from
// the integer part (e.g. "0937492837" -> "937492837", "00" -> "0").
export function sanitizeAmountInput(rawValue) {
  const digitsAndDot = rawValue.replace(/[^0-9.]/g, "");
  const [rawIntegerPart, ...decimalParts] = digitsAndDot.split(".");
  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, "");
  if (decimalParts.length === 0) return integerPart;
  return `${integerPart}.${decimalParts.join("").slice(0, 2)}`;
}

// Normalizes the field to always show 2 decimal places once the user leaves
// it (e.g. "200" -> "200.00", "200.5" -> "200.50").
export function formatAmountOnBlur(rawValue) {
  const numeric = Number(rawValue || 0);
  if (!Number.isFinite(numeric) || numeric < 0) return rawValue;
  return numeric.toFixed(2);
}
