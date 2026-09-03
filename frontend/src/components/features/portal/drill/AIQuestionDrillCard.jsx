"use client";

import { Sparkles } from "lucide-react";

const DIFFICULTY_LABELS = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

export default function AIQuestionDrillCard({ data, onSubmit, isSubmitting }) {
  const attempted = data.attempted;
  const selectedKey = data.selected_key;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <span className="text-amber-700 text-sm font-mono uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Personalized Drill
          </span>
          <h4 className="text-lg font-serif font-bold text-stone-900">{data.title}</h4>
        </div>
        <span className="text-sm font-mono text-stone-500">
          {attempted ? "Completed Today" : "Today's Exercise"}
        </span>
      </div>

      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-600/10 blur-xl" />
        <div className="flex gap-3 mb-4 relative z-10">
          <div className="bg-amber-600 text-stone-950 font-bold px-2.5 py-1 text-[11px] font-mono tracking-widest uppercase rounded">
            {DIFFICULTY_LABELS[data.difficulty] || "Scenario"}
          </div>
          <span className="text-xs text-stone-400 font-mono tracking-wide">{data.topic}</span>
        </div>
        <p className="text-sm md:text-base leading-relaxed font-medium text-stone-50 relative z-10">
          {data.question}
        </p>
        {data.context && (
          <p className="text-sm text-amber-500 font-mono mt-4 bg-stone-950/80 p-2.5 rounded border border-stone-800 relative z-10">
            Goal: {data.context}
          </p>
        )}
      </div>

      <div className="space-y-3.5">
        <p className="text-sm font-mono uppercase text-stone-400 tracking-wider">Select Your Answer</p>
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
                  : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700 disabled:hover:bg-white"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full font-mono text-sm font-bold flex items-center justify-center shrink-0 ${
                  highlight
                    ? isCorrectOption
                      ? "bg-emerald-600 text-white"
                      : "bg-rose-600 text-white"
                    : "bg-stone-100 text-stone-500"
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
        <div className="border-t border-stone-100 pt-4 text-xs leading-relaxed text-stone-600 bg-stone-50 rounded-xl p-4 border border-stone-100">
          <p className="font-bold text-stone-800 mb-1">Explanation</p>
          <p className="font-light">{data.explanation}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-stone-100 gap-4">
        <span className="text-sm text-stone-500">
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
