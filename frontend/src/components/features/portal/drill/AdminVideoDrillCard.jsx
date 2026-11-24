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
    <div className="bg-cn-p-card border border-cn-p-line rounded-cn-p p-6 space-y-6 ">
      <div className="flex items-center justify-between border-b border-cn-p-line pb-4">
        <div>
          <span className="text-cn-p-accent text-sm font-semibold flex items-center gap-1.5 mb-0.5">
            <Film className="w-3.5 h-3.5" />
            Today's Daily Drill
          </span>
          <h4 className="text-lg font-bold text-cn-p-ink">{data.title}</h4>
        </div>
        <span className="text-sm text-cn-p-ink-2">
          {isCompleted ? "Completed Today" : "Today's Exercise"}
        </span>
      </div>

      {data.description && <p className="text-sm text-cn-p-ink-2 font-light">{data.description}</p>}

      <DrillVideoPlayer src={data.file_url || data.video_url} onProgress={handleVideoProgress} />

      {!quizUnlocked && !isCompleted && (
        <div className="flex items-center gap-2 text-xs text-cn-p-ink-2 bg-cn-p-page border border-cn-p-line rounded-xl p-3">
          <Lock className="w-3.5 h-3.5" />
          Watch at least {data.video_watch_threshold_percent}% of the video to unlock the quiz
          ({watchedPercent}% watched)
        </div>
      )}

      {isCompleted ? (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 border ${
            passed ? "bg-cn-p-ok-bg border-cn-p-ok-bg" : "bg-cn-p-page border-cn-p-line"
          }`}
        >
          {passed ? (
            <CheckCircle2 className="w-5 h-5 text-cn-p-ok shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-cn-p-ink-2 shrink-0" />
          )}
          <p className={`text-sm ${passed ? "text-cn-p-ok" : "text-cn-p-ink-2"}`}>
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
          <div className="space-y-4 pt-2 border-t border-cn-p-line">
            <p className="text-sm uppercase text-cn-p-ink-2 tracking-wider">Quick Check</p>
            <p className="text-xs text-cn-p-ink-2 font-light -mt-2">
              You get one submission — answer carefully before you submit.
            </p>
            {data.quiz_questions.map((question) => (
              <div key={question.id} className="space-y-2">
                <p className="text-sm font-semibold text-cn-p-ink">{question.text}</p>
                <div className="space-y-2">
                  {question.choices.map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      disabled={submitMutation.isPending}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: choice.id }))}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                        answers[question.id] === choice.id
                          ? "bg-cn-p-accent/10 border-cn-p-accent-soft text-cn-p-accent"
                          : "bg-cn-p-card border-cn-p-line text-cn-p-ink-2 hover:bg-cn-p-page"
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
              className="w-full py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold font-semibold rounded-xl shadow-sm transition"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
