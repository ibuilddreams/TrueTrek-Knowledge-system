// Renders 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11-13 -> "11th"/"12th"/"13th", etc.
export function getOrdinalLabel(number) {
  const remainder100 = number % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${number}th`;
  switch (number % 10) {
    case 1:
      return `${number}st`;
    case 2:
      return `${number}nd`;
    case 3:
      return `${number}rd`;
    default:
      return `${number}th`;
  }
}

// Builds a padded list of ordinal positions [1..N] for a reorderable-position
// <select>: at least 10 options, rounded up to the next multiple of ten, so
// there's room to plan ahead in a nearly-empty list instead of only ever
// offering the next slot.
export function buildOrdinalOrderOptions(requiredMaxOrder) {
  const maxOrder = Math.max(10, Math.ceil(requiredMaxOrder / 10) * 10);
  return Array.from({ length: maxOrder }, (_, index) => index + 1);
}
