"use client";

// The design's section header (`.head` in new-design.html): the title on the
// left over seven columns, a short lead on the right over five, their
// baselines aligned at the bottom. It recurs down the whole home page, which
// is why it is a component rather than markup repeated per section.
//
// `tone="ink"` is the same header on the design's one dark band, where the
// title and lead take the on-ink colours.
//
// `align="center"` is the design's `.head.center` variant — one centred
// column with the title held to 22ch so it breaks into the same shape the
// split layout gives it.
export default function CobaltSectionHead({
  heading,
  lead,
  align = "split",
  tone = "paper",
  headingId,
  className = "",
  reveal = true,
}) {
  const isDark = tone === "ink";
  const isCenter = align === "center";
  const revealProps = reveal
    ? { "data-cn-reveal": true, className: "cn-reveal" }
    : { className: "" };

  return (
    <div
      {...revealProps}
      className={`${revealProps.className} mb-16 grid gap-6 ${
        isCenter
          ? "justify-items-center text-center"
          : "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:items-end"
      } ${className}`}
    >
      <h2
        id={headingId}
        className={`text-cn-section font-extrabold tracking-[-0.035em] ${
          isDark ? "text-cn-on-ink" : "text-cn-ink"
        } ${isCenter ? "max-w-[22ch]" : ""}`}
      >
        {heading}
      </h2>
      {lead && (
        <p
          className={`max-w-[40ch] text-cn-lg leading-[1.5] ${
            isDark ? "text-cn-on-ink-2" : "text-cn-ink-2"
          }`}
        >
          {lead}
        </p>
      )}
    </div>
  );
}
