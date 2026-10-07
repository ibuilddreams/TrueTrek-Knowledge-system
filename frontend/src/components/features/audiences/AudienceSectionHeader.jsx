"use client";

// Section header for the audience page. Not SectionHeading: that one centres
// its copy and has no room for a count or an action, which both sections here
// need so the heading row carries the same weight as the grid beneath it.
export default function AudienceSectionHeader({
  eyebrow,
  heading,
  description,
  count,
  countLabel,
  action,
}) {
  return (
    <div className="mb-8 border-b border-line pb-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <span className="mb-2.5 block font-sans text-xs font-medium uppercase tracking-widest text-moss">
            {eyebrow}
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-serif text-3xl font-light leading-[1.15] tracking-tight text-ink md:text-4xl">
              {heading}
            </h2>
            {count != null && (
              <span className="shrink-0 rounded-full border border-pine/10 bg-sage/40 px-3 py-1 font-sans text-[11px] font-semibold tabular-nums tracking-widest text-muted">
                {count} {countLabel}
                {count === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>

        {action}
      </div>

      {description && (
        <p className="mt-3.5 max-w-2xl text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
    </div>
  );
}
