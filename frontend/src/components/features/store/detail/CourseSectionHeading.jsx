// Shared heading for every section of the course page.
//
// `tone` picks the palette: "porcelain" (the default, unchanged) for the
// instructor screens still on the moss/pine system, "cobalt" for the store's
// course page, which has moved onto the new design system.
export default function CourseSectionHeading({ id, children, subtitle, tone = "porcelain" }) {
  const isCobalt = tone === "cobalt";
  return (
    <div className="mb-6">
      <h2
        id={id}
        className={
          isCobalt
            ? "text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-cn-ink"
            : "text-2xl font-serif tracking-tight text-ink"
        }
      >
        {children}
      </h2>
      {/* The porcelain screens keep their gold rule under the heading; the
          design's course page has none, so the cobalt tone drops it. */}
      {!isCobalt && (
        <span
          aria-hidden="true"
          className="mt-2 block h-0.5 w-10 rounded-full bg-gold"
        />
      )}
      {subtitle && (
        <p className={`mt-3 ${isCobalt ? "text-sm text-cn-ink-2" : "text-xs text-muted font-sans"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
