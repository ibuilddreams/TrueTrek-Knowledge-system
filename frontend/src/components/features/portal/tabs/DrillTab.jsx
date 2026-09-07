"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Swords } from "lucide-react";
import confetti from "canvas-confetti";
import { submitDrillAttempt } from "@/services/dailyDrillService";
import { useDailyDrillToday } from "@/hooks/student/useDailyDrillToday";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import LegacyQuestionDrillCard from "../drill/LegacyQuestionDrillCard";
import AIQuestionDrillCard from "../drill/AIQuestionDrillCard";
import AdminVideoDrillCard from "../drill/AdminVideoDrillCard";
import StreakReengagementBanner from "../drill/StreakReengagementBanner";

// Points/streak/score are synced into the portal header from StudentPortal.jsx
// instead of from here — that fetch runs once on portal load regardless of
// which tab is active, so the header never shows stale/placeholder numbers
// before a student happens to open the Drill tab. This component reads the
// same cached query (see useDailyDrillToday) purely to render the drill itself.
export default function DrillTab({ onNotify }) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useDailyDrillToday();

  const stats = data?.stats;

  // Shared by AI_QUESTION and LEGACY_QUESTION — both submit through the same
  // single-question endpoint (see daily_drill.services.submit_single_question_answer).
  const submitMutation = useMutation({
    mutationFn: (answerKey) => submitDrillAttempt(answerKey),
    onSuccess: (response) => {
      const result = response?.data;
      if (!result) return;

      queryClient.setQueryData(["daily-drill", "today"], result);

      const isAiType = result.type === "AI_QUESTION";
      const isCorrect = isAiType
        ? result.selected_key === result.correct_answer
        : result.score_awarded === 100;
      const pointsEarned = isAiType ? result.points_awarded : result.xp_earned;

      onNotify?.({
        title:
          pointsEarned > 0
            ? `🔥 DRILL COMPLETED (+${pointsEarned} pts)`
            : "Drill completed — 0 points earned",
        desc: isAiType
          ? isCorrect
            ? "Correct! Your scorecard has been updated."
            : "Not quite — see the explanation below for the right answer. No points were earned this time."
          : `You scored ${result.score_awarded}/100. ${
              isCorrect ? "PERFECT SCORE BONUS! " : ""
            }Your scorecard has been updated.`,
        type: "points",
      });

      if (isCorrect) {
        confetti({ particleCount: 120, spread: 80, colors: ["#059669", "#10b981", "#fbbf24"] });
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
          <p className="text-sm font-medium text-stone-600">
            {getApiErrorMessage(error, "Unable to load today's drill.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm py-2 px-4 rounded-lg tracking-wide transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.type === "UNAVAILABLE") {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <EmptyState
          icon={Swords}
          label="No drill available today"
          description="Check back soon — a new situational drill is added regularly."
          size="lg"
        />
      </div>
    );
  }

  const isSubmitting = submitMutation.isPending;
  const handleSubmit = (answerKey) => {
    if (isSubmitting) return;
    submitMutation.mutate(answerKey);
  };

  return (
    <div className="space-y-4">
      <StreakReengagementBanner streakDetail={stats?.streak_detail} />
      {data.type === "ADMIN_VIDEO" && <AdminVideoDrillCard data={data} onNotify={onNotify} />}
      {data.type === "AI_QUESTION" && (
        <AIQuestionDrillCard data={data} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}
      {data.type === "LEGACY_QUESTION" && (
        <LegacyQuestionDrillCard data={data} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}
    </div>
  );
}
