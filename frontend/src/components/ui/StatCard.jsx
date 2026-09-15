"use client";

export default function StatCard({
  label,
  value,
  icon: Icon,
  footer,
  hint,
  accent = "amber",
  size = "base",
}) {
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

  const tone = accents[accent] || accents.amber;

  return (
    <div
      className={`group relative bg-paper border border-line p-5 sm:p-6 rounded-card shadow-soft overflow-hidden transition-shadow duration-200 ${tone.glow}`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tone.bar} opacity-90`}
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
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${tone.icon}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
