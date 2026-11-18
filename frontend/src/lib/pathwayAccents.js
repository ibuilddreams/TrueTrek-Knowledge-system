/**
 * Accent palette for the pathway cards (`PathwayCard`, `AudiencePathwayCard`).
 *
 * Both cards share one layout and differ only by accent — the rule along the
 * top, the icon halo and the "view details" line — so a grid of pathways
 * reads as a set of distinct paths to choose between rather than a wall of
 * identical tiles.
 *
 * Every value is a design-system token from `app/globals.css`. They are handed
 * to `PathwayCard.module.css` as custom properties rather than Tailwind
 * classes so the CSS module stays the single owner of the card's styling (and
 * so no class name has to be built at runtime, which Tailwind can't scan for).
 *
 * The accent is picked by the card's position in the grid, not by pathway id,
 * so each row shows the full rotation no matter which pathways are published.
 */
export const PATHWAY_ACCENTS = [
  {
    line: "var(--color-blue)",
    halo: "rgba(39, 91, 216, 0.16)",
    iconBg: "var(--color-sky)",
    iconFg: "var(--color-pine)",
    text: "var(--color-blue)",
  },
  {
    line: "var(--color-pine)",
    halo: "rgba(9, 45, 41, 0.14)",
    iconBg: "var(--color-sage)",
    iconFg: "var(--color-pine)",
    text: "var(--color-pine)",
  },
  {
    // The gold token is too light to read as text on paper, so the darker
    // companion already used for gold-on-light copy elsewhere stands in.
    line: "var(--color-gold)",
    halo: "rgba(199, 168, 91, 0.26)",
    iconBg: "rgba(199, 168, 91, 0.18)",
    iconFg: "#8a6f2e",
    text: "#8a6f2e",
  },
  {
    line: "var(--color-moss)",
    halo: "rgba(33, 72, 63, 0.16)",
    iconBg: "var(--color-mint)",
    iconFg: "var(--color-pine)",
    text: "var(--color-moss)",
  },
];

export function getPathwayAccent(index = 0) {
  const position = Number.isFinite(index) ? Math.abs(Math.trunc(index)) : 0;
  return PATHWAY_ACCENTS[position % PATHWAY_ACCENTS.length];
}

/**
 * The inline `style` object a pathway card spreads onto its root element.
 */
// The cobalt system's own rotation. It carries one hue, so the cards are told
// apart by weight rather than by colour — a grid of pathways still reads as a
// set of distinct paths without five competing accents on white paper.
export const PATHWAY_ACCENTS_COBALT = [
  {
    line: "var(--color-cn-accent)",
    halo: "rgba(36, 80, 230, 0.16)",
    iconBg: "var(--color-cn-paper-3)",
    iconFg: "var(--color-cn-accent)",
    text: "var(--color-cn-accent)",
  },
  {
    line: "var(--color-cn-accent-3)",
    halo: "rgba(15, 37, 128, 0.14)",
    iconBg: "var(--color-cn-paper-4)",
    iconFg: "var(--color-cn-accent-3)",
    text: "var(--color-cn-accent-3)",
  },
  {
    line: "var(--color-cn-accent-soft)",
    halo: "rgba(135, 159, 241, 0.22)",
    iconBg: "var(--color-cn-paper-2)",
    iconFg: "var(--color-cn-accent-2)",
    text: "var(--color-cn-accent-2)",
  },
];

export function pathwayAccentStyle(index, tone = "porcelain") {
  const accent =
    tone === "cobalt"
      ? PATHWAY_ACCENTS_COBALT[index % PATHWAY_ACCENTS_COBALT.length]
      : getPathwayAccent(index);

  return {
    "--pathway-accent": accent.line,
    "--pathway-accent-halo": accent.halo,
    "--pathway-accent-icon-bg": accent.iconBg,
    "--pathway-accent-icon-fg": accent.iconFg,
    "--pathway-accent-text": accent.text,
  };
}
