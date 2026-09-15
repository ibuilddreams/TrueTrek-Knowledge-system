"use client";

export default function SectionHeading({
  eyebrow,
  heading,
  subtitle,
  align = "center",
  className = "",
  eyebrowClassName = "text-gold",
  headingClassName = "text-3xl md:text-4xl font-serif font-light leading-[0.95] tracking-tight text-ink",
  subtitleClassName = "text-muted text-sm max-w-xl mx-auto font-light leading-relaxed",
  size = "base",
}) {
  const isLg = size === "lg";
  return (
    <div className={[align === "center" ? "text-center" : "", className].filter(Boolean).join(" ")}>
      {eyebrow && (
        <span
          className={[
            eyebrowClassName,
            `${isLg ? "text-sm" : "text-xs"} font-sans font-medium uppercase tracking-widest block mb-3`,
          ].join(" ")}
        >
          {eyebrow}
        </span>
      )}
      <h2 className={[headingClassName, "mb-4"].join(" ")}>{heading}</h2>
      {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
    </div>
  );
}
