"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Swords } from "lucide-react";
import confetti from "canvas-confetti";
import { submitDrillAttempt } from "@/services/dailyDrillService";
import { useDailyDrillToday } from "@/hooks/student/useDailyDrillToday";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import PortalCard from "../shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalKicker,
  PortalKv,
  PortalKvItem,
} from "../shell/PortalUI";
import LegacyQuestionDrillCard from "../drill/LegacyQuestionDrillCard";
import AIQuestionDrillCard from "../drill/AIQuestionDrillCard";
import AdminVideoDrillCard from "../drill/AdminVideoDrillCard";
import StreakReengagementBanner from "../drill/StreakReengagementBanner";

const formatDays = (value) => `${value ?? 0} ${value === 1 ? "day" : "days"}`;

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
      <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} tone="cobalt" label="Loading today's drill..." />
      </div>
    );
  }

  if (isError) {
    return (
      <PortalCard className="mx-auto max-w-lg p-10 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-6 w-6" />
        </span>
        <p className="mb-6 text-sm text-cn-p-ink-2">
          {getApiErrorMessage(error, "Unable to load today's drill.")}
        </p>
        <PortalButton onClick={() => refetch()}>Retry</PortalButton>
      </PortalCard>
    );
  }

  if (!data || data.type === "UNAVAILABLE") {
    return (
      <PortalCard>
        <PortalEmpty
          icon={Swords}
          title="No drill available today"
          text="Check back soon — a new situational drill is added regularly."
        />
      </PortalCard>
    );
  }

  const isSubmitting = submitMutation.isPending;
  const handleSubmit = (answerKey) => {
    if (isSubmitting) return;
    submitMutation.mutate(answerKey);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <StreakReengagementBanner streakDetail={stats?.streak_detail} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          {data.type === "ADMIN_VIDEO" && <AdminVideoDrillCard data={data} onNotify={onNotify} />}
          {data.type === "AI_QUESTION" && (
            <AIQuestionDrillCard data={data} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          )}
          {data.type === "LEGACY_QUESTION" && (
            <LegacyQuestionDrillCard data={data} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          )}
        </div>

        {/* The design's side column. Every figure here is one the server
            actually sends (see daily_drill stats) — the mock's "this week
            4 / 5" and "best move rate 80%" are hardcoded in the design and
            have no field behind them, so they are not repeated as if real. */}
        <div className="grid gap-5">
          <PortalCard className="flex flex-col gap-2.5 p-5">
            <PortalKicker>Your drill record</PortalKicker>
            <PortalKv columns={2}>
              <PortalKvItem label="Current streak" value={formatDays(stats?.streak_detail?.current_streak)} />
              <PortalKvItem label="Longest streak" value={formatDays(stats?.streak_detail?.longest_streak)} />
              <PortalKvItem label="Drills answered" value={stats?.attempts_count ?? 0} />
              <PortalKvItem label="Average score" value={`${Math.round(stats?.aggregate_score ?? 0)}%`} />
            </PortalKv>
            <span className="text-sm text-cn-p-ink-2">
              A new drill unlocks every morning. Your scorecard updates as soon
              as you answer.
            </span>
          </PortalCard>

          <PortalCard className="flex flex-col gap-2 p-5">
            <PortalKicker>Tomorrow</PortalKicker>
            <b className="font-bold text-cn-p-ink">A new situational drill</b>
            <span className="text-sm text-cn-p-ink-2">Unlocks at midnight</span>
          </PortalCard>
        </div>
      </div>
    </div>
  );
}
