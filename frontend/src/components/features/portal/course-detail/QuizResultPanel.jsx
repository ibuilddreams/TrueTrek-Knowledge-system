"use client";

import { AlertCircle } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { useQuizAttemptResult } from "@/hooks/student/useQuizAttempt";
import { PortalButton, PortalRing } from "../shell/PortalUI";

export default function QuizResultPanel({ attemptId, onClose }) {
  const { data: result, isLoading, isError } = useQuizAttemptResult(attemptId);
  // `attempt_status` is the backend's own authoritative signal
  // (_recompute_quiz_result sets SUBMITTED while any answer is still
  // PENDING_GRADING, GRADED once every answer — including AI-graded short
  // answers — has a final mark) rather than guessing from question types,
  // which can't tell a still-pending answer apart from one AI already graded.
  const hasPendingGrading = result?.attempt_status === "SUBMITTED";

  if (isLoading) {
    return (
      <div className="flex justify-center py-10" aria-busy="true">
        <Loader fullScreen={false} label="Grading your attempt..." />
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <AlertCircle aria-hidden="true" className="h-6 w-6 text-cn-p-bad" />
        <p className="text-sm text-cn-p-ink-2">
          Your attempt was submitted, but the result isn&apos;t ready yet — check back shortly.
        </p>
        <PortalButton variant="sec" onClick={onClose}>
          Close
        </PortalButton>
      </div>
    );
  }

  const percentage = Math.round(Number(result.percentage));

  return (
    <div className="flex flex-col items-center gap-5 text-center">
      <PortalRing value={percentage} size={140} label={`${percentage}%`} />

      <h3 className="text-2xl font-bold tracking-[-0.015em] text-cn-p-ink">
        {result.is_passed ? "You passed" : "Not passed this time"}
      </h3>

      <p className="text-cn-p-ink-2">
        Score: {result.score} · Attempt {result.attempt_number} ·{" "}
        {result.is_passed ? "Passed" : "Not passed"}
      </p>

      {hasPendingGrading && (
        <p className="rounded-xl bg-cn-p-warn-bg px-3.5 py-2.5 text-[13px] text-cn-p-warn">
          Some short-answer responses are pending manual grading — your score may change once
          they&apos;re reviewed.
        </p>
      )}

      <PortalButton variant="sec" onClick={onClose}>
        Close
      </PortalButton>
    </div>
  );
}
