"use client";

// The cobalt design system's inner-page banner (new-design.html `.banner`):
// a paper-2 band carrying a masked dot field, with an optional pill above a
// title and its lead, stacked in one left column.
//
// Shared rather than written per page: several pages carry this header, and
// hand-written copies are how the measure, the padding and the pill drift
// apart one page at a time.
//
// Two layouts. `stacked` (the default) puts the title over its lead in one
// left column, which is what a title that wraps to two or three lines needs —
// the split would leave a hole in the middle of its own track. `split` is the
// design's `.banner.solo`: title left over seven columns, lead right over
// five, baselines aligned. Use it only where the title is one short line.
export default function CobaltPageHeader({
  id,
  icon: Icon,
  eyebrow,
  title,
  lead,
  layout = "stacked",
  // `h1` on a page whose title is the page's own; pages that already carry an
  // h1 elsewhere pass "h2" so the document keeps one.
  as: Heading = "h1",
  children,
}) {
  const isSplit = layout === "split";

  return (
    <header
      id={id}
      className="cn-banner relative isolate overflow-hidden bg-cn-paper-2 py-14 md:py-20"
    >
      <div
        className={
          isSplit
            ? "cn-container grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end"
            : "cn-container"
        }
      >
        {eyebrow && (
          <span className="mb-6 inline-flex h-[34px] items-center gap-2 rounded-full border border-cn-rule bg-white pr-3.5 pl-1 text-sm font-medium text-cn-ink-2 shadow-cn-1">
            {Icon && (
              <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-cn-accent text-white">
                <Icon className="h-3.5 w-3.5" />
              </span>
            )}
            {eyebrow}
          </span>
        )}
        <Heading
          className={`cn-enter text-cn-display-s font-extrabold tracking-[-0.035em] text-cn-ink ${
            isSplit ? "" : "max-w-[16ch] text-balance"
          }`}
        >
          {title}
        </Heading>
        {lead && (
          <p
            className={`cn-enter leading-[1.5] text-cn-ink-2 ${
              isSplit
                ? "max-w-[40ch] text-cn-lg"
                : "mt-6 max-w-[56ch] text-lg text-pretty"
            }`}
            style={{ "--cn-delay": "90ms" }}
          >
            {lead}
          </p>
        )}
        {children}
      </div>
    </header>
  );
}
