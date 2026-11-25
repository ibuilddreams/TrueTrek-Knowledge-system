"use client";

import { HelpCircle } from "lucide-react";

export default function LegacyQuestionDrillCard({ data, onSubmit, isSubmitting }) {
  const question = data.question;
  const attempted = data.attempted;

  return (
    <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p p-6 space-y-6 ">
      <div className="flex items-center justify-between border-b border-cn-p-line pb-4">
        <div>
          <span className="text-cn-p-accent text-sm font-semibold block mb-0.5">
            Situational drills
          </span>
          <h4 className="text-lg font-bold text-cn-p-ink">Recruit & NIL Integrity</h4>
        </div>
        <span className="text-sm text-cn-p-ink-2">
          {attempted ? "Completed Today" : "Today's Exercise"}
        </span>
      </div>

      <div className="bg-cn-p-accent text-white p-6 rounded-2xl border border-cn-p-line relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-cn-p-warn/10 blur-xl" />
        <div className="flex gap-3 mb-4 relative z-10">
          <div className="bg-cn-p-warn text-cn-p-accent font-bold px-2.5 py-1 text-[11px] tracking-widest uppercase rounded">
            Dilemma case
          </div>
          <span className="text-xs text-white/60 tracking-wide">Governance Scenario</span>
        </div>
        <p className="text-sm md:text-base leading-relaxed font-medium text-white relative z-10">
          {question.scenario}
        </p>
        <p className="text-sm text-cn-p-warn mt-4 flex items-center gap-1.5 bg-cn-p-neutral-bg p-2.5 rounded border border-cn-p-line/50 relative z-10">
          <HelpCircle className="w-4 h-4 shrink-0" />
          Guidelines: {question.guidelines}
        </p>
      </div>

      <div className="space-y-3.5">
        <p className="text-sm uppercase text-cn-p-ink-2 tracking-wider">Select Your Action</p>
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
                    ? "bg-cn-p-ok-bg border-cn-p-ok text-cn-p-ok shadow-xs"
                    : "bg-orange-50 border-orange-500 text-orange-950 shadow-xs"
                  : "bg-cn-p-card hover:bg-cn-p-page border-cn-p-line text-cn-p-ink-2 disabled:hover:bg-cn-p-card"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${
                  isSelected
                    ? isPerfect
                      ? "bg-cn-p-ok text-white"
                      : "bg-orange-600 text-white"
                    : "bg-cn-p-page text-cn-p-ink-2"
                }`}
              >
                {option.key}
              </span>
              <div className="space-y-1.5 flex-1">
                <p className="text-sm font-semibold leading-relaxed">{option.text}</p>
                {isSelected && (
                  <div className="border-t border-dotted border-current/20 pt-2 text-xs leading-relaxed">
                    <p className={`font-bold ${isPerfect ? "text-cn-p-ok" : "text-orange-700"}`}>
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

      <div className="flex items-center justify-between pt-4 border-t border-cn-p-line gap-4">
        <span className="text-sm text-cn-p-ink-2">
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
