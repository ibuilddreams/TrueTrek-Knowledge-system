"use client";

import { Sparkles } from "lucide-react";

const DIFFICULTY_LABELS = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export default function AIQuestionDrillCard({ data, onSubmit, isSubmitting }) {
  const attempted = data.attempted;
  const selectedKey = data.selected_key;

  return (
    <div className="bg-paper border border-line rounded-card p-6 space-y-6 shadow-soft">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="text-pine text-sm font-mono uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Personalized Drill
          </span>
          <h4 className="text-lg font-serif font-bold text-ink">{data.title}</h4>
        </div>
        <span className="text-sm font-mono text-muted">
          {attempted ? "Completed Today" : "Today's Exercise"}
        </span>
      </div>

      <div className="bg-pine text-paper p-6 rounded-2xl border border-moss relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-gold/10 blur-xl" />
        <div className="flex gap-3 mb-4 relative z-10">
          <div className="bg-gold text-pine font-bold px-2.5 py-1 text-[11px] font-mono tracking-widest uppercase rounded">
            {DIFFICULTY_LABELS[data.difficulty] || "Scenario"}
          </div>
          <span className="text-sm text-paper/60 font-mono tracking-wide">{data.topic}</span>
        </div>
        <p className="text-sm md:text-base leading-relaxed font-medium text-paper relative z-10">
          {data.question}
        </p>
        {data.context && (
          <p className="text-sm text-gold font-mono mt-4 bg-ink/30 p-2.5 rounded border border-moss/50 relative z-10">
            Goal: {data.context}
          </p>
        )}
      </div>

      <div className="space-y-3.5">
        <p className="text-sm font-mono uppercase text-muted tracking-wider">Select Your Answer</p>
        {data.options.map((option) => {
          const isSelected = attempted && option.key === selectedKey;
          const isCorrectOption = attempted && option.key === data.correct_answer;
          const highlight = isSelected || isCorrectOption;

          return (
            <button
              key={option.key}
              type="button"
              disabled={attempted || isSubmitting}
              onClick={() => onSubmit(option.key)}
              className={`w-full text-left p-4 rounded-xl border flex gap-4 transition-all disabled:cursor-not-allowed ${
                highlight
                  ? isCorrectOption
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs"
                    : "bg-rose-50 border-rose-500 text-rose-950 shadow-xs"
                  : "bg-paper hover:bg-porcelain border-line text-muted disabled:hover:bg-paper"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full font-mono text-sm font-bold flex items-center justify-center shrink-0 ${
                  highlight
                    ? isCorrectOption
                      ? "bg-emerald-600 text-paper"
                      : "bg-rose-600 text-paper"
                    : "bg-porcelain text-muted"
                }`}
              >
                {option.key}
              </span>
              <p className="text-sm font-semibold leading-relaxed flex-1">{option.text}</p>
            </button>
          );
        })}
      </div>

      {attempted && data.explanation && (
        <div className="border-t border-line pt-4 text-xs leading-relaxed text-muted bg-porcelain rounded-xl p-4 border border-line">
          <p className="font-bold text-ink mb-1">Explanation</p>
          <p className="font-light">{data.explanation}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-line gap-4">
        <span className="text-sm text-muted">
          {attempted
            ? data.points_awarded > 0
              ? `You've completed today's drill and earned +${data.points_awarded} points — a new one arrives tomorrow.`
              : "You've completed today's drill. That wasn't the correct answer, so 0 points were earned this time — a new one arrives tomorrow."
            : isSubmitting
              ? "Submitting your answer..."
              : "This drill was generated for you based on your recent learning activity."}
        </span>
      </div>
    </div>
  );
}
