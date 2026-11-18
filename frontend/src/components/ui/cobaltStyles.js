// Shared class strings for the cobalt design system's controls.
//
// These pages each hand-wrote the same button three or four times, which is
// how a palette drifts one page at a time. Importing them keeps every cobalt
// surface on one set of values; a page still styles anything it needs that is
// genuinely its own.

/** The one cobalt action. 50px, the design's standard control height. */
export const CN_BTN_PRIMARY =
  "inline-flex h-[50px] items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cn-accent disabled:cursor-not-allowed disabled:opacity-50";

/** White with a strong rule — the second action beside a primary. */
export const CN_BTN_SECONDARY =
  "inline-flex h-[50px] items-center justify-center gap-2 rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-sm font-semibold text-cn-ink shadow-cn-1 transition-[border-color,transform] duration-150 ease-cn-out enabled:hover:-translate-y-px enabled:hover:border-cn-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent disabled:cursor-not-allowed disabled:opacity-50";

/** No fill until hovered — a tertiary action, or one that leaves the page. */
export const CN_BTN_GHOST =
  "inline-flex h-11 items-center justify-center gap-2 rounded-cn-sm px-3 text-sm font-semibold text-cn-muted transition-colors duration-150 hover:bg-cn-paper-2 hover:text-cn-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent";

/** The white panel every cobalt page builds its content out of. */
export const CN_CARD =
  "rounded-cn-lg border border-cn-rule bg-white shadow-cn-1";

/** A quiet notice (guest cart, guest wishlist) — paper-2, no shout. */
export const CN_NOTICE =
  "flex items-start gap-3 rounded-cn border border-cn-rule bg-cn-paper-2 p-4 text-sm leading-relaxed text-cn-ink-2";
