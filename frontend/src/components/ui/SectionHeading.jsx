"use client";

export default function SectionHeading({
  eyebrow,
  heading,
  subtitle,
  align = "center",
  className = "",
  eyebrowClassName = "text-amber-500",
  headingClassName = "text-3xl md:text-4xl font-serif font-semibold tracking-tight text-white",
  subtitleClassName = "text-stone-400 text-sm max-w-xl mx-auto font-light leading-relaxed",
}) {
  return (
    <div className={[align === "center" ? "text-center" : "", className].filter(Boolean).join(" ")}>
      {eyebrow && (
        <span className={[eyebrowClassName, "text-xs font-mono uppercase tracking-widest block mb-3"].join(" ")}>
          {eyebrow}
        </span>
      )}
      <h2 className={[headingClassName, "mb-4"].join(" ")}>{heading}</h2>
      {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
    </div>
  );
}
