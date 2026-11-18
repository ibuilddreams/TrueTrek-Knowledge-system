// The design's level pill, in the one place every surface reads it from.
//
// Three fixed colours keyed off the API's own uppercase difficulty values;
// anything unrecognised falls back to the neutral paper chip rather than
// rendering an unstyled badge. The store card and the course page's ink hero
// both draw this pill, and a second copy is how the two drift apart.
export const LEVEL_TONES = {
  BEGINNER: "bg-cn-ok-bg text-cn-ok",
  INTERMEDIATE: "bg-cn-paper-3 text-cn-accent-3",
  ADVANCED: "bg-cn-warn-bg text-cn-warn",
};

/** "BEGINNER" -> "Beginner". Null when the course has no difficulty set. */
export function levelLabel(difficulty) {
  if (!difficulty) return null;
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}
