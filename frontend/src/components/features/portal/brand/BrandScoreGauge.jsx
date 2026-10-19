"use client";

// Tailwind can't generate a class from a runtime value, so the stroke colour
// is resolved to a literal here rather than interpolated into a class name.
const BANDS = [
  { min: 75, stroke: "#4F6F52", label: "text-pine" },
  { min: 50, stroke: "#C7A85B", label: "text-gold" },
  { min: 0, stroke: "#D96F5F", label: "text-clay" },
];

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function BrandScoreGauge({ score = 0, verdict }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const band = BANDS.find((entry) => safeScore >= entry.min) || BANDS[BANDS.length - 1];
  const dashOffset = CIRCUMFERENCE * (1 - safeScore / 100);

  return (
    <div className="flex flex-col items-center text-center gap-3">
      <div className="relative w-[136px] h-[136px]">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full -rotate-90"
          role="img"
          aria-label={`Sponsor-readiness score: ${safeScore} out of 100`}
        >
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            className="stroke-porcelain"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            stroke={band.stroke}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 900ms ease-out" }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-serif font-light tracking-tight ${band.label}`}>
            {safeScore}
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
            / 100
          </span>
        </div>
      </div>

      {verdict && (
        <p className="text-sm font-serif font-bold text-ink leading-snug max-w-[220px]">{verdict}</p>
      )}
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
        Sponsor readiness
      </p>
    </div>
  );
}
