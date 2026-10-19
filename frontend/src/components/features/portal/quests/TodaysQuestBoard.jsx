"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, RefreshCw, Swords } from "lucide-react";
import { completeQuest, skipQuest } from "@/services/questsService";
import { TODAYS_QUESTS_QUERY_KEY, useTodaysQuests } from "@/hooks/student/useTodaysQuests";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import QuestStatStrip from "./QuestStatStrip";
import QuestProgressBar from "./QuestProgressBar";
import QuestTaskCard from "./QuestTaskCard";
import QuestCompleteModal from "./QuestCompleteModal";
import QuestRewardsStrip from "./QuestRewardsStrip";

/**
 * The daily quest dashboard: progress tracking, today's task cards, and the
 * rewards those tasks pay into — the three elements the brief asks for.
 *
 * Tasks stay visible together rather than being stepped through one at a
 * time, so the student can see their whole day and pick what to do next.
 */
export default function TodaysQuestBoard({ onNotify, onOpenRewards }) {
  const queryClient = useQueryClient();
  const [completingAssignment, setCompletingAssignment] = useState(null);

  const { data, isLoading, isError, error, refetch } = useTodaysQuests();

  const refreshQuests = () => {
    queryClient.invalidateQueries({ queryKey: TODAYS_QUESTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["quests"] });
    // Completing a quest moves the points balance, which the rewards strip,
    // the Rewards tab and the portal header all read from these caches.
    queryClient.invalidateQueries({ queryKey: ["points"] });
    queryClient.invalidateQueries({ queryKey: ["rewards"] });
  };

  const completeMutation = useMutation({
    mutationFn: ({ id, payload }) => completeQuest(id, payload),
  });
  const skipMutation = useMutation({ mutationFn: (id) => skipQuest(id) });

  const handleConfirmComplete = async (payload) => {
    if (!completingAssignment) return;
    try {
      const response = await completeMutation.mutateAsync({
        id: completingAssignment.id,
        payload,
      });
      const awarded = response?.data?.quest?.points_awarded ?? 0;
      toastSuccess(`Quest complete — +${awarded} points.`);
      // PortalToast renders { title, desc, type } — same shape DrillTab sends.
      onNotify?.({
        title: `✅ QUEST COMPLETE (+${awarded} pts)`,
        desc: `"${completingAssignment.quest.title}" is logged. Your points balance has been updated.`,
        type: "points",
      });
      setCompletingAssignment(null);
      refreshQuests();
    } catch (completeError) {
      toastError(getApiErrorMessage(completeError, "Unable to complete this quest."));
    }
  };

  const handleSkip = async (assignment) => {
    try {
      await skipMutation.mutateAsync(assignment.id);
      toastSuccess("Quest skipped for today.");
      refreshQuests();
    } catch (skipError) {
      toastError(getApiErrorMessage(skipError, "Unable to skip this quest."));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10">
        <Loader fullScreen={false} label="Loading today's quests..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <p className="text-sm text-muted font-light">
          {getApiErrorMessage(error, "Unable to load today's quests.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-pine hover:bg-moss text-paper font-bold font-mono text-xs uppercase tracking-wider rounded-lg transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const quests = data?.quests || [];
  const stats = data?.stats;

  if (quests.length === 0) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-6">
        <EmptyState
          icon={Swords}
          label="No quests available yet."
          description="Your coaching staff hasn't published any quests. Check back soon."
          size="lg"
        />
      </div>
    );
  }

  const resolvedCount = quests.filter((item) => item.status !== "ASSIGNED").length;
  const completedCount = quests.filter((item) => item.status === "COMPLETED").length;
  const allDone = resolvedCount === quests.length;
  const isBusy = completeMutation.isPending || skipMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-5 sm:p-6 overflow-hidden space-y-5">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-serif font-light text-ink">Today&apos;s Quests</h2>
            <p className="text-xs text-muted font-light mt-1 leading-relaxed">
              Small actions that build your brand in the real world. Do one, log it, earn points.
            </p>
          </div>

          {allDone && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold font-mono uppercase tracking-wider rounded-lg bg-sage/40 text-pine border border-pine/20 shrink-0">
              <Check className="w-3.5 h-3.5" />
              All done today
            </span>
          )}
        </div>

        <QuestStatStrip stats={stats} />
        <QuestProgressBar completed={resolvedCount} total={quests.length} />
      </div>

      <QuestRewardsStrip onOpenRewards={onOpenRewards} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {quests.map((assignment) => (
          <QuestTaskCard
            key={assignment.id}
            assignment={assignment}
            onComplete={setCompletingAssignment}
            onSkip={handleSkip}
            isBusy={isBusy}
          />
        ))}
      </div>

      {allDone && (
        <p className="text-center text-xs text-muted font-light">
          {completedCount} of {quests.length} completed · a fresh set lands tomorrow — come back to
          keep your {stats?.current_streak ?? 0} day streak alive.
        </p>
      )}

      <QuestCompleteModal
        isOpen={Boolean(completingAssignment)}
        onClose={() => setCompletingAssignment(null)}
        quest={completingAssignment?.quest}
        onConfirm={handleConfirmComplete}
        isSubmitting={completeMutation.isPending}
      />
    </div>
  );
}
