"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useStartQuizAttempt, useSubmitQuizAttempt } from "@/hooks/student/useQuizAttempt";
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
        "You have an unsubmitted quiz attempt. Leaving now means it can't be resumed and still counts toward your attempt limit. Leave anyway?"
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

  const hasPendingGrading = (attempt?.questions || []).some(
    (question) => question.question_type === "SHORT_ANSWER"
  );

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
        <QuizResultPanel
          attemptId={attempt.attempt_id}
          hasPendingGrading={hasPendingGrading}
          onClose={resetAndClose}
        />
      )}
    </Modal>
  );
}
