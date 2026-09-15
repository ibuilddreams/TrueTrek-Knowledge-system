"use client";

import { HelpCircle } from "lucide-react";

export default function LegacyQuestionDrillCard({ data, onSubmit, isSubmitting }) {
  const question = data.question;
  const attempted = data.attempted;

  return (
    <div className="bg-paper border border-line rounded-card p-6 space-y-6 shadow-soft">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="text-pine text-sm font-mono uppercase tracking-wider block mb-0.5">
            Situational Drills
          </span>
          <h4 className="text-lg font-serif font-bold text-ink">Recruit & NIL Integrity</h4>
        </div>
        <span className="text-sm font-mono text-muted">
          {attempted ? "Completed Today" : "Today's Exercise"}
        </span>
      </div>

      <div className="bg-pine text-paper p-6 rounded-2xl border border-moss relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-gold/10 blur-xl" />
        <div className="flex gap-3 mb-4 relative z-10">
          <div className="bg-gold text-pine font-bold px-2.5 py-1 text-[11px] font-mono tracking-widest uppercase rounded">
            Dilemma Case
          </div>
          <span className="text-xs text-paper/60 font-mono tracking-wide">Governance Scenario</span>
        </div>
        <p className="text-sm md:text-base leading-relaxed font-medium text-paper relative z-10">
          {question.scenario}
        </p>
        <p className="text-sm text-gold font-mono mt-4 flex items-center gap-1.5 bg-ink/30 p-2.5 rounded border border-moss/50 relative z-10">
          <HelpCircle className="w-4 h-4 shrink-0" />
          Guidelines: {question.guidelines}
        </p>
      </div>

      <div className="space-y-3.5">
        <p className="text-sm font-mono uppercase text-muted tracking-wider">Select Your Action</p>
        {question.options.map((option) => {
          const isRevealed = option.score !== undefined;
          const isPerfect = isRevealed && option.score === 100;
          const isSelected = attempted && isRevealed;

          return (
            <button
              key={option.id}
              type="button"
              disabled={attempted || isSubmitting}
              onClick={() => onSubmit(option.key)}
              className={`w-full text-left p-4 rounded-xl border flex gap-4 transition-all disabled:cursor-not-allowed ${
                isSelected
                  ? isPerfect
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs"
                    : "bg-orange-50 border-orange-500 text-orange-950 shadow-xs"
                  : "bg-paper hover:bg-porcelain border-line text-muted disabled:hover:bg-paper"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full font-mono text-sm font-bold flex items-center justify-center shrink-0 ${
                  isSelected
                    ? isPerfect
                      ? "bg-emerald-600 text-paper"
                      : "bg-orange-600 text-paper"
                    : "bg-porcelain text-muted"
                }`}
              >
                {option.key}
              </span>
              <div className="space-y-1.5 flex-1">
                <p className="text-sm font-semibold leading-relaxed">{option.text}</p>
                {isSelected && (
                  <div className="border-t border-dotted border-current/20 pt-2 text-xs leading-relaxed">
                    <p className={`font-bold ${isPerfect ? "text-emerald-700" : "text-orange-700"}`}>
                      Score {option.score}/100 — {isPerfect ? "SUCCESS" : "DILUTED RESULTS"}
                    </p>
                    <p className="opacity-90 mt-1 font-light">{option.impact}</p>
                    <p className="font-medium mt-1">Rationale: {option.rationale}</p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-line gap-4">
        <span className="text-sm text-muted">
          {attempted
            ? "You've completed today's drill — a new one arrives tomorrow."
            : isSubmitting
              ? "Submitting your answer..."
              : "Drill tracking updates automatically on your scorecard."}
        </span>
      </div>
    </div>
  );
}
