"use client";

export default function StatCard({
  label,
  value,
  icon: Icon,
  footer,
  hint,
  accent = "amber",
  size = "base",
  // "cobalt" renders the portal design's own stat tile — flat, no seam, one
  // accent — so a screen on the new design can keep using StatCard. The
  // default is the porcelain card, unchanged, which the admin portal reads.
  tone = "porcelain",
}) {
  if (tone === "cobalt") {
    const TILES = {
      amber: "bg-cn-p-soft text-cn-p-accent",
      stone: "bg-cn-p-neutral-bg text-cn-p-ink-2",
      emerald: "bg-cn-p-ok-bg text-cn-p-ok",
      rose: "bg-cn-p-warn-bg text-cn-p-warn",
    };
    return (
      <section className="rounded-cn-p border border-cn-p-line bg-cn-p-card p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-cn-p-ink-2">{label}</p>
          {Icon && (
            <span
              className={`grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm ${TILES[accent] || TILES.amber}`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
            </span>
          )}
        </div>
        <p className="mt-3 truncate text-[32px] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-cn-p-ink">
          {value}
        </p>
        {hint && <p className="mt-2 text-[13px] text-cn-p-muted">{hint}</p>}
        {footer}
      </section>
    );
  }

  const accents = {
    amber: {
      bar: "from-gold/60 via-gold to-gold/60",
      icon: "bg-gold/12 text-gold border-gold/25",
      glow: "hover:border-gold/30 hover:shadow-[0_16px_44px_rgba(199,168,91,0.16)]",
    },
    stone: {
      bar: "from-pine via-moss to-pine",
      icon: "bg-porcelain text-ink border-line",
      glow: "hover:border-ink/15 hover:shadow-elevated",
    },
    emerald: {
      bar: "from-moss via-pine to-moss",
      icon: "bg-sage/50 text-pine border-pine/15",
      glow: "hover:border-pine/20 hover:shadow-elevated",
    },
    rose: {
      bar: "from-clay via-rose to-clay",
      icon: "bg-rose/35 text-clay border-clay/20",
      glow: "hover:border-clay/25 hover:shadow-[0_16px_44px_rgba(217,111,95,0.14)]",
    },
  };

  const skin = accents[accent] || accents.amber;

  return (
    <div
      className={`tt-card group relative bg-paper border border-line p-5 sm:p-6 rounded-card shadow-soft overflow-hidden transition-shadow duration-200 ${skin.glow}`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${skin.bar} opacity-90`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`${size === "lg" ? "text-xs" : "text-[11px]"} font-sans uppercase tracking-widest text-muted font-medium`}
          >
            {label}
          </p>
          <p className="text-3xl sm:text-4xl font-serif font-light text-ink mt-2 tracking-tight truncate">
            {value}
          </p>
          {hint && (
            <p
              className={`${size === "lg" ? "text-sm" : "text-[11px]"} text-muted font-light mt-2 leading-snug`}
            >
              {hint}
            </p>
          )}
          {footer}
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${skin.icon}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
