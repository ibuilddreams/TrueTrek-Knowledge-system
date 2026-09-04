"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useStartQuizAttempt, useSubmitQuizAttempt } from "@/hooks/student/useQuizAttempt";
import { toastInfo } from "@/lib/toast";
import QuizIntroPanel from "./QuizIntroPanel";
import QuizAttemptRunner from "./QuizAttemptRunner";
import QuizResultPanel from "./QuizResultPanel";

export default function QuizAttemptModal({ quiz, canInteract, onClose }) {
  const [phase, setPhase] = useState("intro");
  const [attempt, setAttempt] = useState(null);

  const startAttemptMutation = useStartQuizAttempt();
  const submitAttemptMutation = useSubmitQuizAttempt();

  const isOpen = Boolean(quiz);

  function resetAndClose() {
    setPhase("intro");
    setAttempt(null);
    onClose();
  }

  function handleRequestClose() {
    if (phase === "in_progress") {
      const confirmed = window.confirm(
        "Your progress is saved automatically, so you can resume this attempt later. Close for now?"
      );
      if (!confirmed) return;
    }
    resetAndClose();
  }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleRequestClose}
      icon={CircleHelp}
      title={quiz?.title}
      subtitle={phase === "in_progress" ? "Attempt in progress" : undefined}
      maxWidth="max-w-2xl"
    >
      {quiz && phase === "intro" && (
        <QuizIntroPanel
          quiz={quiz}
          canInteract={canInteract}
          isStarting={startAttemptMutation.isPending}
          onStart={handleStart}
        />
      )}
      {quiz && phase === "in_progress" && attempt && (
        <QuizAttemptRunner
          attempt={attempt}
          isSubmitting={submitAttemptMutation.isPending}
          onSubmit={handleSubmit}
        />
      )}
      {quiz && phase === "result" && attempt && (
        <QuizResultPanel attemptId={attempt.attempt_id} onClose={resetAndClose} />
      )}
    </Modal>
  );
}
