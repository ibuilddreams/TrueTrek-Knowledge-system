"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, HelpCircle, Swords } from "lucide-react";
import confetti from "canvas-confetti";
import { getTodaysDrill, submitDrillAttempt } from "@/services/dailyDrillService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";

export default function DrillTab({
  setPoints,
  setStreakDays,
  setAggregateScore,
  onNotify,
}) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["daily-drill", "today"],
    queryFn: async () => {
      const response = await getTodaysDrill();
      return response?.data || null;
    },
  });

  const stats = data?.stats;

  useEffect(() => {
    if (!stats) return;
    setPoints(stats.points);
    setStreakDays(stats.streak);
    setAggregateScore(stats.aggregate_score);
    // setPoints/setStreakDays/setAggregateScore identities change with the
    // values they set (see usePortalSession) — depending on the raw stat
    // values here, not the setters, avoids re-firing this effect forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats?.points, stats?.streak, stats?.aggregate_score]);

  const submitMutation = useMutation({
    mutationFn: (optionId) => submitDrillAttempt(optionId),
    onSuccess: (response) => {
      const result = response?.data;
      if (!result) return;

      queryClient.setQueryData(["daily-drill", "today"], result);

      const isPerfect = result.score_awarded === 100;
      onNotify?.({
        title: `🔥 DRILL COMPLETED (+${result.xp_earned} XP)`,
        desc: `You scored ${result.score_awarded}/100. ${
          isPerfect ? "PERFECT SCORE BONUS! " : ""
        }Your scorecard has been updated.`,
        type: "points",
      });

      if (isPerfect) {
        confetti({
          particleCount: 120,
          spread: 80,
          colors: ["#059669", "#10b981", "#fbbf24"],
        });
      }
    },
    onError: (mutationError) => {
      toastError(getApiErrorMessage(mutationError, "Unable to submit your answer."));
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6 min-h-[40vh] flex items-center justify-center">
        <Loader fullScreen={false} label="Loading today's drill..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-stone-600">
            {getApiErrorMessage(error, "Unable to load today's drill.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs py-2 px-4 rounded-lg tracking-wide transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const question = data?.question;

  if (!question) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <EmptyState
          icon={Swords}
          label="No drill available today"
          description="Check back soon — a new situational drill is added regularly."
        />
      </div>
    );
  }

  const attempted = data.attempted;
  const isSubmitting = submitMutation.isPending;

  const handleSelectOption = (optionId) => {
    if (attempted || isSubmitting) return;
    submitMutation.mutate(optionId);
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
          {attempted ? "Completed Today" : "Today's Exercise"}
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
          {question.scenario}
        </p>
        <p className="text-xs text-amber-500 font-mono mt-4 flex items-center gap-1.5 bg-stone-950/80 p-2.5 rounded border border-stone-800 relative z-10">
          <HelpCircle className="w-4 h-4 shrink-0" />
          Guidelines: {question.guidelines}
        </p>
      </div>

      <div className="space-y-3.5">
        <p className="text-xs font-mono uppercase text-stone-400 tracking-wider">
          Select Your Action
        </p>
        {question.options.map((option) => {
          const isRevealed = option.score !== undefined;
          const isPerfect = isRevealed && option.score === 100;
          const isSelected = attempted && isRevealed;

          return (
            <button
              key={option.id}
              type="button"
              disabled={attempted || isSubmitting}
              onClick={() => handleSelectOption(option.id)}
              className={`w-full text-left p-4 rounded-xl border flex gap-4 transition-all disabled:cursor-not-allowed ${
                isSelected
                  ? isPerfect
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs"
                    : "bg-orange-50 border-orange-500 text-orange-950 shadow-xs"
                  : "bg-white hover:bg-stone-50 border-stone-200 text-stone-700 disabled:hover:bg-white"
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

      <div className="flex items-center justify-between pt-4 border-t border-stone-100 gap-4">
        <span className="text-xs text-stone-500">
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
