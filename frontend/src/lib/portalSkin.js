/**
 * One translation table from the two older palettes to the signed-in portal's
 * `cn-p-*` tokens.
 *
 * Some components are rendered by the admin portal (still on the porcelain and
 * stone/amber systems these files were written in) *and* by the teacher or
 * student portal, which are on the new design. Rather than a ternary on every
 * element — which is where two palettes quietly drift apart — those components
 * take a `tone` prop and wrap their class strings in `makeSkin(tone)`.
 *
 * A class with no entry here is passed through untouched, so layout utilities
 * are unaffected and a class added later keeps its original look until it is
 * listed below.
 */
const COBALT = {
  // porcelain / moss
  "bg-porcelain": "bg-cn-p-page",
  "bg-porcelain/40": "bg-cn-p-page",
  "bg-porcelain/60": "bg-cn-p-page",
  "bg-paper": "bg-cn-p-card",
  "hover:bg-paper": "hover:bg-cn-p-page",
  "border-line": "border-cn-p-line",
  "text-ink": "text-cn-p-ink",
  "text-muted": "text-cn-p-ink-2",
  "text-clay": "text-cn-p-warn",
  "hover:text-pine": "hover:text-cn-p-accent",
  "text-pine": "text-cn-p-accent",
  "hover:border-pine": "hover:border-cn-p-accent",
  "hover:bg-sage/20": "hover:bg-cn-p-soft",
  "disabled:hover:border-line": "disabled:hover:border-cn-p-line",
  "disabled:hover:bg-paper": "disabled:hover:bg-cn-p-card",
  "hover:text-clay": "hover:text-cn-p-warn",
  "bg-paper/60": "bg-cn-p-card",
  "focus:border-pine": "focus:border-cn-p-accent",
  "focus:bg-paper": "focus:bg-cn-p-card",
  "placeholder:text-muted": "placeholder:text-cn-p-muted",

  // stone / amber
  "bg-white": "bg-cn-p-card",
  "bg-stone-50": "bg-cn-p-page",
  "bg-stone-50/60": "bg-cn-p-page",
  "bg-stone-100": "bg-cn-p-neutral-bg",
  "bg-stone-200": "bg-cn-p-track",
  "border-stone-100": "border-cn-p-line",
  "border-stone-200": "border-cn-p-line",
  "border-stone-300": "border-cn-p-line-2",
  "text-stone-300": "text-cn-p-muted",
  "text-stone-400": "text-cn-p-muted",
  "text-stone-500": "text-cn-p-ink-2",
  "text-stone-600": "text-cn-p-ink-2",
  "text-stone-700": "text-cn-p-ink-2",
  "text-stone-800": "text-cn-p-ink",
  "text-stone-900": "text-cn-p-ink",
  "text-emerald-700": "text-cn-p-ok",
  "bg-emerald-600": "bg-cn-p-ok",
  "bg-emerald-50": "bg-cn-p-ok-bg",
  "border-emerald-200": "border-cn-p-ok-bg",
  "text-amber-700": "text-cn-p-warn",
  "text-amber-900": "text-cn-p-warn",
  "bg-amber-600": "bg-cn-p-accent",
  "bg-amber-50": "bg-cn-p-warn-bg",
  "border-amber-200": "border-cn-p-warn-bg",
  "focus:border-amber-600": "focus:border-cn-p-accent",
  "text-rose-600": "text-cn-p-bad",
  "text-rose-700": "text-cn-p-bad",
  "bg-rose-50": "bg-cn-p-bad-bg",
  "border-rose-200": "border-cn-p-bad-bg",
  "border-red-300": "border-cn-p-bad",
  "text-red-600": "text-cn-p-bad",

  // shape and type: the design is Inter throughout, with flat cards, 16px and
  // 10px radii, and labels in sentence case rather than tracked small caps.
  "rounded-2xl": "rounded-cn-p",
  "rounded-xl": "rounded-cn-p-sm",
  "rounded-lg": "rounded-cn-p-sm",
  "font-mono": "",
  "font-serif": "",
  "shadow-sm": "",
  "shadow-soft": "",
  uppercase: "",
  "tracking-wider": "",
  "tracking-widest": "",
};

export function makeSkin(tone) {
  if (tone !== "cobalt") return (classes) => classes;
  return (classes) =>
    classes
      .split(" ")
      .map((c) => (c in COBALT ? COBALT[c] : c))
      .filter(Boolean)
      .join(" ");
}
