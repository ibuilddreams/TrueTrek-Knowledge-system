"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { useQuizAttemptResult } from "@/hooks/student/useQuizAttempt";

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
      <div className="text-center py-8 space-y-4">
        <AlertCircle className="w-6 h-6 mx-auto text-rose-500" />
        <p className="text-sm text-muted">
          Your attempt was submitted, but the result isn&apos;t ready yet — check back shortly.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl transition bg-pine hover:bg-moss text-paper"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center py-4">
      <div
        className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border ${
          result.is_passed
            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
            : "bg-rose-50 border-rose-100 text-rose-600"
        }`}
      >
        {result.is_passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
      </div>
      <div>
        <p className="text-3xl font-serif font-bold text-ink">
          {Math.round(Number(result.percentage))}%
        </p>
        <p className="text-sm mt-1 text-muted">
          Score: {result.score} · Attempt {result.attempt_number} ·{" "}
          {result.is_passed ? "Passed" : "Not passed"}
        </p>
      </div>
      {hasPendingGrading ? (
        <p
          className="text-sm rounded-xl px-3.5 py-2.5 border bg-gold/12 text-gold border-gold/25"
        >
          Some short-answer responses are pending manual grading — your score may change once
          they&apos;re reviewed.
        </p>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl transition bg-pine hover:bg-moss text-paper"
      >
        Close
      </button>
    </div>
  );
}
