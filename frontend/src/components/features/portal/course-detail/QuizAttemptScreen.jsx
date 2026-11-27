"use client";

import { useState } from "react";
import { CircleHelp } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useStartQuizAttempt, useSubmitQuizAttempt } from "@/hooks/student/useQuizAttempt";
import { toastInfo } from "@/lib/toast";
import PortalCard from "../shell/PortalCard";
import { PortalButton, PortalCrumbs, PortalPageHead } from "../shell/PortalUI";
import QuizIntroPanel from "./QuizIntroPanel";
import QuizAttemptRunner from "./QuizAttemptRunner";
import QuizResultPanel from "./QuizResultPanel";

/**
 * Sitting a quiz, opened from the Quizzes tab.
 *
 * The two halves are deliberately different shapes, because they are asking
 * for different things.
 *
 * **Deciding** is a dialog. Opening a quiz from the list is a question — this
 * one, 70% to pass, 12 minutes, start? — and the list behind it is the
 * context for that question.
 *
 * **Sitting it** is a screen *inside the portal*, in place of the quiz list.
 * It is not a viewport takeover: the sidebar, the top bar and the student's
 * own navigation all stay exactly where they were. A quiz is coursework, not
 * a call — there is nothing here that breaks if the student can see the rest
 * of their portal, and hiding it only made the page feel like it had gone
 * wrong. (The classroom and War Room Live *do* take the viewport, because a
 * live call genuinely owns the device's camera and microphone.)
 *
 * `phase` is owned by the caller rather than here, because it decides a
 * layout the caller renders: the list stays up behind the intro dialog and is
 * replaced once the attempt starts, and one source of truth is what keeps
 * those two from disagreeing.
 *
 * The three panels are the same ones the lesson view's `QuizPlayerPanel`
 * renders inline, so a quiz behaves identically wherever a student reaches
 * it. Only the frame differs.
 */
export default function QuizAttemptScreen({
  quiz,
  canInteract,
  phase,
  onPhaseChange,
  onClose,
}) {
  const [attempt, setAttempt] = useState(null);

  const startAttemptMutation = useStartQuizAttempt();
  const submitAttemptMutation = useSubmitQuizAttempt();

  if (!quiz) return null;

  function closeAttempt() {
    setAttempt(null);
    onClose();
  }

  function handleLeaveAttempt() {
    if (phase === "in_progress") {
      const confirmed = window.confirm(
        "Your progress is saved automatically, so you can resume this attempt later. Leave for now?",
      );
      if (!confirmed) return;
    }
    closeAttempt();
  }

  function handleStart() {
    startAttemptMutation.mutate(quiz.id, {
      onSuccess: (response) => {
        setAttempt(response?.data || null);
        onPhaseChange("in_progress");
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
      { onSuccess: () => onPhaseChange("result") },
    );
  }

  if (phase === "intro") {
    return (
      <Modal
        isOpen
        onClose={closeAttempt}
        icon={CircleHelp}
        title={quiz.title}
        subtitle={quiz.course?.title || quiz.module?.title || undefined}
        maxWidth="max-w-lg"
      >
        <QuizIntroPanel
          quiz={quiz}
          canInteract={canInteract}
          isStarting={startAttemptMutation.isPending}
          onStart={handleStart}
          showTitle={false}
        />
      </Modal>
    );
  }

  const isRunning = phase === "in_progress";

  return (
    // A measured column rather than the full content width: the portal is up
    // to 1440px wide, and answer rows stretched across all of it are harder to
    // read, not easier. The head is inside the column too, so the page title
    // and the questions share one left edge.
    <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)] gap-5">
      <PortalPageHead
        title={quiz.title}
        subtitle={
          isRunning
            ? "Your answers are saved as you go, so you can come back to an unfinished attempt."
            : undefined
        }
        crumbs={
          <PortalCrumbs
            items={[
              { label: "Quizzes", onClick: handleLeaveAttempt },
              { label: isRunning ? "Attempt in progress" : "Your result" },
            ]}
          />
        }
      >
        <PortalButton variant="sec" onClick={handleLeaveAttempt}>
          {isRunning ? "Save and exit" : "Back to quizzes"}
        </PortalButton>
      </PortalPageHead>

      <PortalCard className="p-5 sm:p-7">
        {isRunning && attempt && (
          <QuizAttemptRunner
            attempt={attempt}
            isSubmitting={submitAttemptMutation.isPending}
            onSubmit={handleSubmit}
          />
        )}
        {phase === "result" && attempt && (
          <QuizResultPanel attemptId={attempt.attempt_id} onClose={closeAttempt} />
        )}
      </PortalCard>
    </div>
  );
}
