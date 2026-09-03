"use client";

import { HelpCircle } from "lucide-react";

export default function LegacyQuestionDrillCard({ data, onSubmit, isSubmitting }) {
  const question = data.question;
  const attempted = data.attempted;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <span className="text-amber-700 text-sm font-mono uppercase tracking-wider block mb-0.5">
            Situational Drills
          </span>
          <h4 className="text-lg font-serif font-bold text-stone-900">Recruit & NIL Integrity</h4>
        </div>
        <span className="text-sm font-mono text-stone-500">
          {attempted ? "Completed Today" : "Today's Exercise"}
        </span>
      </div>

      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-600/10 blur-xl" />
        <div className="flex gap-3 mb-4 relative z-10">
          <div className="bg-amber-600 text-stone-950 font-bold px-2.5 py-1 text-[11px] font-mono tracking-widest uppercase rounded">
            Dilemma Case
          </div>
          <span className="text-xs text-stone-400 font-mono tracking-wide">Governance Scenario</span>
        </div>
        <p className="text-sm md:text-base leading-relaxed font-medium text-stone-50 relative z-10">
          {question.scenario}
        </p>
        <p className="text-sm text-amber-500 font-mono mt-4 flex items-center gap-1.5 bg-stone-950/80 p-2.5 rounded border border-stone-800 relative z-10">
          <HelpCircle className="w-4 h-4 shrink-0" />
          Guidelines: {question.guidelines}
        </p>
      </div>

      <div className="space-y-3.5">
        <p className="text-sm font-mono uppercase text-stone-400 tracking-wider">Select Your Action</p>
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
                  : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700 disabled:hover:bg-white"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full font-mono text-sm font-bold flex items-center justify-center shrink-0 ${
                  isSelected
                    ? isPerfect
                      ? "bg-emerald-600 text-white"
                      : "bg-orange-600 text-white"
                    : "bg-stone-100 text-stone-500"
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

      <div className="flex items-center justify-between pt-4 border-t border-stone-100 gap-4">
        <span className="text-sm text-stone-500">
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
