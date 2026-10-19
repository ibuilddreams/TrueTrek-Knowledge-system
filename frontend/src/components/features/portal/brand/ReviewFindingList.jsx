"use client";

const SEVERITY_TONE = {
  HIGH: "bg-rose/35 text-clay border-clay/25",
  MEDIUM: "bg-gold/12 text-gold border-gold/25",
  LOW: "bg-porcelain text-muted border-line",
};

export default function ReviewFindingList({
  title,
  icon: Icon,
  findings = [],
  tone = "neutral",
  emptyLabel,
  numbered = false,
}) {
  const accent = {
    positive: "bg-sage/40 text-pine border-pine/20",
    negative: "bg-rose/35 text-clay border-clay/20",
    neutral: "bg-gold/12 text-gold border-gold/25",
  }[tone];

  return (
    <div className="bg-paper border border-line rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${accent}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
        <h3 className="text-sm font-serif font-bold text-ink">{title}</h3>
        <span className="ml-auto text-[11px] font-mono text-muted">{findings.length}</span>
      </div>

      {findings.length === 0 ? (
        <p className="text-xs text-muted font-light">{emptyLabel}</p>
      ) : (
        <ul className="space-y-3.5">
          {findings.map((finding, index) => (
            <li
              key={`${finding.title}-${index}`}
              className="flex gap-3 pb-3.5 last:pb-0 border-b last:border-b-0 border-line"
            >
              {numbered && (
                <span className="w-6 h-6 shrink-0 rounded-lg bg-pine text-paper text-[11px] font-mono font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-ink leading-snug">{finding.title}</p>
                  {finding.severity && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest border shrink-0 ${
                        SEVERITY_TONE[finding.severity] || SEVERITY_TONE.MEDIUM
                      }`}
                    >
                      {finding.severity}
                    </span>
                  )}
                </div>
                {finding.detail && finding.detail !== finding.title && (
                  <p className="text-xs text-muted font-light mt-1 leading-relaxed">
                    {finding.detail}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
