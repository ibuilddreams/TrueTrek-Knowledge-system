"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import { useStartQuizAttempt, useSubmitQuizAttempt } from "@/hooks/student/useQuizAttempt";
import { toastInfo } from "@/lib/toast";
import QuizIntroPanel from "../course-detail/QuizIntroPanel";
import QuizAttemptRunner from "../course-detail/QuizAttemptRunner";
import QuizResultPanel from "../course-detail/QuizResultPanel";

export default function QuizPlayerPanel({ quiz, canInteract }) {
  const [phase, setPhase] = useState("intro");
  const [attempt, setAttempt] = useState(null);

  const startAttemptMutation = useStartQuizAttempt();
  const submitAttemptMutation = useSubmitQuizAttempt();

  function handleStart() {
    startAttemptMutation.mutate(quiz.id, {
      onSuccess: (response) => {
        setAttempt(response?.data || null);
        setPhase("in_progress");
        if (response?.data?.resumed) {
          toastInfo("Resuming your in-progress attempt.");
        }
      },
    });
  }

  function handleSubmit(payload) {
    if (!attempt) return;
    submitAttemptMutation.mutate(
      { attemptId: attempt.attempt_id, payload },
      { onSuccess: () => setPhase("result") }
    );
  }

  function handleResultClose() {
    setPhase("intro");
    setAttempt(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl border shrink-0 bg-violet-50 text-violet-600 border-violet-100">
          <CircleHelp className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] mb-1 text-gold/80">
            Quiz
          </p>
          <h2 className="font-serif font-bold text-xl sm:text-2xl leading-tight text-ink">
            {quiz.title}
          </h2>
          {phase === "in_progress" ? (
            <p className="text-sm mt-1 text-gold">
              Attempt in progress
            </p>
          ) : null}
        </div>
      </div>

      {phase === "intro" && (
        <QuizIntroPanel
          quiz={quiz}
          canInteract={canInteract}
          isStarting={startAttemptMutation.isPending}
          onStart={handleStart}
        />
      )}
      {phase === "in_progress" && attempt && (
        <QuizAttemptRunner
          attempt={attempt}
          isSubmitting={submitAttemptMutation.isPending}
          onSubmit={handleSubmit}
        />
      )}
      {phase === "result" && attempt && (
        <QuizResultPanel attemptId={attempt.attempt_id} onClose={handleResultClose} />
      )}
    </div>
  );
}
