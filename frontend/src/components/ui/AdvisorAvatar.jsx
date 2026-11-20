"use client";

/**
 * An advisor's face, or their initial where no photograph exists.
 *
 * The advisory council is a fixed, hand-authored list, and a seat can be
 * filled before its portrait arrives — so every surface that draws an advisor
 * goes through here rather than through a bare `<img>` that would render a
 * broken frame. `className` carries the size and shape the caller needs; the
 * fallback takes the same box so swapping a photograph in changes nothing
 * around it.
 */
export function advisorInitial(name) {
  const first = String(name || "").trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export default function AdvisorAvatar({
  name,
  src,
  className = "",
  fallbackClassName = "bg-cn-paper-3 text-cn-accent-3",
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ""}
        className={className}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center font-bold select-none ${fallbackClassName} ${className}`}
    >
      {advisorInitial(name)}
    </span>
  );
}
