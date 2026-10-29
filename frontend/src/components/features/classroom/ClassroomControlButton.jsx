"use client";

/**
 * One round button in the classroom's control bar.
 *
 * `active` means "this input is on" — an off microphone is shown in the
 * warning colour rather than greyed out, so a muted student can tell at a
 * glance why nobody is hearing them.
 */
export default function ClassroomControlButton({
  onClick,
  active = false,
  danger = false,
  disabled = false,
  title,
  children,
}) {
  const tone = danger
    ? "bg-clay text-paper hover:bg-clay/85 border-clay"
    : active
      ? "bg-paper/10 text-paper hover:bg-paper/20 border-paper/20"
      : "bg-clay/90 text-paper hover:bg-clay border-clay/60";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={danger ? undefined : active}
      className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-40 disabled:cursor-not-allowed ${tone}`}
    >
      {children}
    </button>
  );
}
