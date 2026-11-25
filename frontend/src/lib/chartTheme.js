/**
 * The cobalt palette, for charts.
 *
 * Recharts takes colours as props rather than classes, so a chart is the one
 * place a design token cannot be swept by renaming a class — these are hex
 * literals, and the three dashboards each had their own set left over from the
 * porcelain system (dark pine bars, gold accents, stone axes). Importing them
 * from here is what keeps a chart on the same palette as the card it sits in.
 *
 * The values mirror `--color-cn-p-*` in globals.css. They are duplicated as
 * hex rather than read from CSS variables because recharts renders some of
 * these into inline SVG attributes, where `var(--x)` does not resolve.
 */

/** Series colours: one cobalt ramp, darkest first, then a neutral. */
export const CHART_SERIES = ["#2450e6", "#1a3bb8", "#0f2580", "#879ff1", "#6b7280"];

/** The single accent, for a chart with one series. */
export const CHART_ACCENT = "#2450e6";

/** Hairline grid, matching `--color-cn-p-line`. */
export const CHART_GRID = "#e3e7f0";

/** Axis lines and tick labels, matching `--color-cn-p-muted`. */
export const CHART_AXIS = "#6b7280";

/** The dark tooltip the design uses, matching `--color-cn-p-ink`. */
export const CHART_TOOLTIP = {
  contentStyle: {
    backgroundColor: "#111827",
    border: "none",
    borderRadius: "10px",
    padding: "8px 12px",
  },
  labelStyle: { color: "#ffffff", fontWeight: 700 },
  itemStyle: { color: "#c7d0e6" },
};
