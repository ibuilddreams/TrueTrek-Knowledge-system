"use client";

export default function StatCard({
  label,
  value,
  icon: Icon,
  footer,
  hint,
  accent = "amber",
}) {
  const accents = {
    amber: {
      bar: "from-amber-600 to-amber-800",
      icon: "bg-amber-50 text-amber-700 border-amber-100",
      glow: "hover:border-amber-200/80 hover:shadow-amber-900/5",
    },
    stone: {
      bar: "from-stone-600 to-stone-800",
      icon: "bg-stone-100 text-stone-700 border-stone-200",
      glow: "hover:border-stone-300 hover:shadow-stone-900/5",
    },
    emerald: {
      bar: "from-emerald-600 to-emerald-800",
      icon: "bg-emerald-50 text-emerald-700 border-emerald-100",
      glow: "hover:border-emerald-200/80 hover:shadow-emerald-900/5",
    },
    rose: {
      bar: "from-rose-500 to-rose-700",
      icon: "bg-rose-50 text-rose-700 border-rose-100",
      glow: "hover:border-rose-200/80 hover:shadow-rose-900/5",
    },
  };

  const tone = accents[accent] || accents.amber;

  return (
    <div
      className={`group relative bg-white border border-stone-200/90 p-5 sm:p-6 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${tone.glow}`}
    >
      <div
        className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tone.bar} opacity-80`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-semibold">
            {label}
          </p>
          <p className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mt-2 tracking-tight truncate">
            {value}
          </p>
          {hint && (
            <p className="text-[11px] text-stone-400 font-light mt-2 leading-snug">
              {hint}
            </p>
          )}
          {footer}
        </div>
        {Icon && (
          <div
            className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${tone.icon}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
