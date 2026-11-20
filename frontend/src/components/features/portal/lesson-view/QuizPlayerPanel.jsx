"use client";

import { useState } from "react";
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
      { onSuccess: () => setPhase("result") },
    );
  }

  function handleResultClose() {
    setPhase("intro");
    setAttempt(null);
  }

  if (phase === "in_progress" && attempt) {
    return (
      <QuizAttemptRunner
        attempt={attempt}
        isSubmitting={submitAttemptMutation.isPending}
        onSubmit={handleSubmit}
      />
    );
  }

  if (phase === "result" && attempt) {
    return <QuizResultPanel attemptId={attempt.attempt_id} onClose={handleResultClose} />;
  }

  return (
    <QuizIntroPanel
      quiz={quiz}
      canInteract={canInteract}
      isStarting={startAttemptMutation.isPending}
      onStart={handleStart}
    />
  );
}
