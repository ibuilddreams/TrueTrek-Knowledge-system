// Small counts read better as words inside a sentence, which is how the
// design writes them ("Nine pathways, one portal.", "five ways in"). The
// numbers themselves come from real data, so these have to be spelled at
// render time rather than written into the copy — otherwise the sentence goes
// stale the moment a pathway or an audience is added.
//
// Spelled up to twelve, numeric above it, which is the usual prose rule.
const NUMBER_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

export function spellNumber(count) {
  return NUMBER_WORDS[count] ?? String(count);
}

// Same word with its first letter capitalised, for the start of a sentence.
export function spellNumberCapitalised(count) {
  const word = spellNumber(count);
  return word.charAt(0).toUpperCase() + word.slice(1);
}
