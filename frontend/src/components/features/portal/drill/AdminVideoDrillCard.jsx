"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { CheckCircle2, Film, Lock, XCircle } from "lucide-react";
import { recordVideoProgress, submitAdminDrillQuiz } from "@/services/dailyDrillService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import DrillVideoPlayer from "./DrillVideoPlayer";

export default function AdminVideoDrillCard({ data, onNotify }) {
  const queryClient = useQueryClient();
  const [watchedPercent, setWatchedPercent] = useState(data.progress.video_progress_percent);
  const [answers, setAnswers] = useState({});

  // A one-shot submission — pass or fail, `status` becomes COMPLETED and
  // stays that way (no retry), matching the AI/legacy single-question
  // sources. This also means a page refresh correctly shows this same
  // completed summary instead of the quiz form, since it's read straight
  // from the persisted `progress.status`, not local component state.
  const isCompleted = data.progress.status === "COMPLETED";
  const passed = isCompleted && data.progress.score_percent >= data.passing_score_percent;
  const quizUnlocked = watchedPercent >= data.video_watch_threshold_percent;

  const progressMutation = useMutation({
    mutationFn: (percent) => recordVideoProgress(data.schedule_id, percent),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      submitAdminDrillQuiz(
        data.schedule_id,
        Object.entries(answers).map(([questionId, choiceId]) => ({
          question_id: Number(questionId),
          choice_id: choiceId,
        })),
      ),
    onSuccess: (response) => {
      const result = response?.data;
      if (!result) return;
      queryClient.setQueryData(["daily-drill", "today"], result);

      if (result.passed) {
        onNotify?.({
          title: `🔥 DRILL COMPLETED (+${result.progress.points_awarded} pts)`,
          desc: `You scored ${result.progress.score_percent}%. Your scorecard has been updated.`,
          type: "points",
        });
        confetti({ particleCount: 120, spread: 80, colors: ["#059669", "#10b981", "#fbbf24"] });
      } else {
        onNotify?.({
          title: "Daily Drill completed",
          desc: `You scored ${result.progress.score_percent}% — no points awarded this time. A new drill arrives tomorrow.`,
          type: "points",
        });
      }
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to submit the quiz."));
    },
  });

  const handleVideoProgress = (percent) => {
    setWatchedPercent((prev) => Math.max(prev, percent));
    if (percent > data.progress.video_progress_percent) {
      progressMutation.mutate(percent);
    }
  };

  const allQuestionsAnswered = data.quiz_questions.every((question) => answers[question.id] != null);

  return (
    <div className="bg-paper border border-line rounded-card p-6 space-y-6 shadow-soft">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <span className="text-pine text-sm font-mono uppercase tracking-wider flex items-center gap-1.5 mb-0.5">
            <Film className="w-3.5 h-3.5" />
            Today's Daily Drill
          </span>
          <h4 className="text-lg font-serif font-bold text-ink">{data.title}</h4>
        </div>
        <span className="text-sm font-mono text-muted">
          {isCompleted ? "Completed Today" : "Today's Exercise"}
        </span>
      </div>

      {data.description && <p className="text-sm text-muted font-light">{data.description}</p>}

      <DrillVideoPlayer src={data.file_url || data.video_url} onProgress={handleVideoProgress} />

      {!quizUnlocked && !isCompleted && (
        <div className="flex items-center gap-2 text-xs font-mono text-muted bg-porcelain border border-line rounded-xl p-3">
          <Lock className="w-3.5 h-3.5" />
          Watch at least {data.video_watch_threshold_percent}% of the video to unlock the quiz
          ({watchedPercent}% watched)
        </div>
      )}

      {isCompleted ? (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 border ${
            passed ? "bg-emerald-50 border-emerald-200" : "bg-porcelain border-line"
          }`}
        >
          {passed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-muted shrink-0" />
          )}
          <p className={`text-sm ${passed ? "text-emerald-800" : "text-muted"}`}>
            {passed ? (
              <>
                You passed with a score of {data.progress.score_percent}% and earned{" "}
                <span className="font-bold">{data.progress.points_awarded} points</span>.
              </>
            ) : (
              <>
                You scored {data.progress.score_percent}% — the passing score was{" "}
                {data.passing_score_percent}%, so no points were awarded. You've completed today's
                Daily Drill; a new one arrives tomorrow.
              </>
            )}
          </p>
        </div>
      ) : (
        quizUnlocked && (
          <div className="space-y-4 pt-2 border-t border-line">
            <p className="text-sm font-mono uppercase text-muted tracking-wider">Quick Check</p>
            <p className="text-xs text-muted font-light -mt-2">
              You get one submission — answer carefully before you submit.
            </p>
            {data.quiz_questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <p className="text-sm font-semibold text-ink">{question.text}</p>
                <div className="space-y-2">
                  {question.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={submitMutation.isPending}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: choice.id }))}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                        answers[question.id] === choice.id
                          ? "bg-pine/10 border-pine/25 text-pine"
                          : "bg-paper border-line text-muted hover:bg-porcelain"
                      }`}
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              disabled={!allQuestionsAnswered || submitMutation.isPending}
              onClick={() => submitMutation.mutate()}
              className="w-full py-3 bg-pine hover:bg-moss disabled:opacity-50 disabled:cursor-not-allowed text-paper text-sm font-semibold font-mono uppercase tracking-wider rounded-xl shadow-sm transition"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
