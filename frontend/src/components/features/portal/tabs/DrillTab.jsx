"use client";

import { useState } from "react";
import { HelpCircle, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { DRILL_QUESTIONS } from "@/data/curriculum";

export default function DrillTab({
  drillCompletedList,
  setDrillCompletedList,
  setPoints,
  setStreakDays,
  setAggregateScore,
  onNotify,
}) {
  const [activeDrillIndex, setActiveDrillIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  const activeDrill = DRILL_QUESTIONS[activeDrillIndex];

  const handleSelectOption = (optionKey, score) => {
    setSelectedOption(optionKey);

    if (drillCompletedList.includes(activeDrill.id)) return;

    setDrillCompletedList([...drillCompletedList, activeDrill.id]);

    const isPerfect = score === 100;
    let earnedXP = score * 2;
    if (isPerfect) earnedXP += 100;

    setPoints((prev) => prev + earnedXP);
    onNotify?.({
      title: `🔥 DRILL COMPLETED (+${earnedXP} XP)`,
      desc: `You scored ${score}/100. ${isPerfect ? "PERFECT SCORE BONUS! " : ""}Your scorecard has been updated.`,
      type: "points",
    });

    if (isPerfect) {
      setStreakDays((prev) => prev + 1);
      confetti({
        particleCount: 120,
        spread: 80,
        colors: ["#059669", "#10b981", "#fbbf24"],
      });
    }

    setAggregateScore((prev) => Math.round((prev + score) / 2));
  };

  const handleNextDrill = () => {
    setSelectedOption(null);
    setActiveDrillIndex((prev) => (prev + 1) % DRILL_QUESTIONS.length);
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <span className="text-amber-700 text-xs font-mono uppercase tracking-wider block mb-0.5">
            Situational Drills
          </span>
          <h4 className="text-lg font-serif font-bold text-stone-900">
            Recruit & NIL Integrity
          </h4>
        </div>
        <span className="text-xs font-mono text-stone-500">
          Exercise {activeDrillIndex + 1} of {DRILL_QUESTIONS.length}
        </span>
      </div>

      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-amber-600/10 blur-xl" />
        <div className="flex gap-3 mb-4 relative z-10">
          <div className="bg-amber-600 text-stone-950 font-bold px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase rounded">
            Dilemma Case
          </div>
          <span className="text-[11px] text-stone-400 font-mono tracking-wide">
            Governance Scenario
          </span>
        </div>
        <p className="text-sm md:text-base leading-relaxed font-medium text-stone-50 relative z-10">
          {activeDrill.scenario}
        </p>
        <p className="text-xs text-amber-500 font-mono mt-4 flex items-center gap-1.5 bg-stone-950/80 p-2.5 rounded border border-stone-800 relative z-10">
          <HelpCircle className="w-4 h-4 shrink-0" />
          Guidelines: {activeDrill.guidelines}
        </p>
      </div>

      <div className="space-y-3.5">
        <p className="text-xs font-mono uppercase text-stone-400 tracking-wider">
          Select Your Action
        </p>
        {activeDrill.options.map((option) => {
          const isSelected = selectedOption === option.key;
          const isPerfect = option.score === 100;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleSelectOption(option.key, option.score)}
              className={`w-full text-left p-4 rounded-xl border flex gap-4 transition-all ${
                isSelected
                  ? isPerfect
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs"
                    : "bg-orange-50 border-orange-500 text-orange-950 shadow-xs"
                  : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
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
                <p className="text-xs font-semibold leading-relaxed">
                  {option.text}
                </p>
                {isSelected && (
                  <div className="border-t border-dotted border-current/20 pt-2 text-[11px] leading-relaxed">
                    <p
                      className={`font-bold ${
                        isPerfect ? "text-emerald-700" : "text-orange-700"
                      }`}
                    >
                      Score {option.score}/100 —{" "}
                      {isPerfect ? "SUCCESS" : "DILUTED RESULTS"}
                    </p>
                    <p className="opacity-90 mt-1 font-light">{option.impact}</p>
                    <p className="font-medium mt-1">
                      Rationale: {option.rationale}
                    </p>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedOption && (
        <div className="flex items-center justify-between pt-4 border-t border-stone-100 gap-4">
          <span className="text-xs text-stone-500">
            Drill tracking updates automatically on your scorecard.
          </span>
          <button
            type="button"
            onClick={handleNextDrill}
            className="bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg tracking-wide flex items-center gap-1.5 transition shrink-0"
          >
            Next Exercise
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
