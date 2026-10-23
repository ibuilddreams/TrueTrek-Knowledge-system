// Catalog descriptions are authored as several paragraphs: a focus statement,
// one or more labelled sections such as "Core competencies: ...", and a final
// metadata line "Provider: X · 1 credit · Grades K · Subject: Y · Format: Textbook".
// Split them apart so a page can render the prose as paragraphs and the
// metadata as a tidy "Course details" list.
const CREDIT_PATTERN = /^(\d+(?:\.\d+)?)\s+credits?$/i;
const GRADES_PATTERN = /^grades?\s+(.+)$/i;
// A leading "Core competencies:"-style label: short, no sentence punctuation
// before the colon, so a paragraph that merely contains a colon stays prose.
const LABEL_PATTERN = /^([^.:\n]{3,40}):\s+(\S[\s\S]*)$/;

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

function parseParagraph(text) {
  const labelled = text.match(LABEL_PATTERN);
  if (!labelled) return { label: null, text };
  return { label: labelled[1].trim(), text: labelled[2].trim() };
}

export function parseCourseDescription(description) {
  const paragraphs = (description || "")
    .split(/\n{2,}|\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  const metaIndex = paragraphs.findIndex((part) => /^provider:/i.test(part));
  const prose = metaIndex === -1 ? paragraphs : paragraphs.filter((_, index) => index !== metaIndex);
  const facts =
    metaIndex === -1
      ? []
      : paragraphs[metaIndex].split("·").map(parseFact).filter(Boolean);

  return { summary: prose.join("\n\n"), paragraphs: prose.map(parseParagraph), facts };
}
