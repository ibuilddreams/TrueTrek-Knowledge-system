// Pathway descriptions are authored as a single long sentence: a lead-in, a
// dash, then the phases of the pathway separated by semicolons — "Written for
// the person running the program - coaching philosophy...; then development
// systems...; closing on the exit." Rendered verbatim that is a wall of text,
// so this splits it back into the paragraphs it was written as.
//
// Copy that doesn't match the shape is left whole rather than cut up: text
// with its own line breaks is already paragraphed, and a plain sentence comes
// back as one paragraph. Nothing is ever dropped or reworded — only split,
// capitalised and given a full stop.

// A dash with spaces around it. Spacing is what separates a lead-in dash from
// the hyphen inside "decision-making".
const LEAD_IN_DASH = /\s[-–—]\s/;

const CLOSING_MARKS = /["'’”)\]]+$/;
const SENTENCE_END = /[.!?…]$/;

function tidy(part) {
  const text = part.trim().replace(/^[;,]\s*/, "").trim();
  if (!text) return "";

  const first = text[0];
  const capitalised =
    first === first.toUpperCase() ? text : first.toUpperCase() + text.slice(1);

  // A trailing quote or bracket still counts as a closed sentence, so look
  // past it before deciding whether a full stop is missing.
  const bare = capitalised.replace(CLOSING_MARKS, "");
  return SENTENCE_END.test(bare) ? capitalised : `${capitalised}.`;
}

export function toPathwayParagraphs(description) {
  const text = (description || "").trim();
  if (!text) return [];

  // Authored line breaks win — that copy is already paragraphed.
  const authored = text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  if (authored.length > 1) return authored;

  // Only the first dash opens the body; later ones belong to a phase.
  const dash = LEAD_IN_DASH.exec(text);
  const leadIn = dash ? text.slice(0, dash.index) : "";
  const body = dash ? text.slice(dash.index + dash[0].length) : text;

  return [leadIn, ...body.split(";")].map(tidy).filter(Boolean);
}
