// Catalog descriptions end with a metadata line such as
// "Provider: X · 1 credit · Grades K · Subject: Y · Format: Textbook".
// Split it from the prose so the page can show the prose as a description and
// the metadata as a tidy "Course details" list.
const CREDIT_PATTERN = /^(\d+(?:\.\d+)?)\s+credits?$/i;
const GRADES_PATTERN = /^grades?\s+(.+)$/i;

function parseFact(segment) {
  const text = segment.trim();
  if (!text) return null;

  const credit = text.match(CREDIT_PATTERN);
  if (credit) return { label: "Credits", value: credit[1] };

  const grades = text.match(GRADES_PATTERN);
  if (grades) return { label: "Grades", value: grades[1] };

  const separator = text.indexOf(":");
  if (separator > 0) {
    const label = text.slice(0, separator).trim();
    const value = text.slice(separator + 1).trim();
    if (label && value) return { label, value };
  }
  return null;
}

export function parseCourseDescription(description) {
  const paragraphs = (description || "")
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const metaIndex = paragraphs.findIndex((part) => /^provider:/i.test(part));
  if (metaIndex === -1) return { summary: paragraphs.join("\n\n"), facts: [] };

  const facts = paragraphs[metaIndex]
    .split("·")
    .map(parseFact)
    .filter(Boolean);
  const summary = paragraphs.filter((_, index) => index !== metaIndex).join("\n\n");
  return { summary, facts };
}
