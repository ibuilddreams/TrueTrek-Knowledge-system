"use client";

import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { useQuizAttemptResult } from "@/hooks/student/useQuizAttempt";
import { useTheme } from "@/hooks/useTheme";

export default function QuizResultPanel({ attemptId, hasPendingGrading, onClose }) {
  const { isVault } = useTheme();
  const { data: result, isLoading, isError } = useQuizAttemptResult(attemptId);

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
        <AlertCircle className={`w-6 h-6 mx-auto ${isVault ? "text-rose-400" : "text-rose-500"}`} />
        <p className={`text-xs ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          Your attempt was submitted, but the result isn&apos;t ready yet — check back shortly.
        </p>
        <button
          type="button"
          onClick={onClose}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider rounded-xl transition ${
            isVault
              ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
              : "bg-stone-900 hover:bg-stone-800 text-white"
          }`}
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
            ? isVault
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-emerald-50 border-emerald-100 text-emerald-600"
            : isVault
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-rose-50 border-rose-100 text-rose-600"
        }`}
      >
        {result.is_passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
      </div>
      <div>
        <p className={`text-3xl font-serif font-bold ${isVault ? "text-stone-50" : "text-stone-900"}`}>
          {Math.round(Number(result.percentage))}%
        </p>
        <p className={`text-xs mt-1 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          Score: {result.score} · Attempt {result.attempt_number} ·{" "}
          {result.is_passed ? "Passed" : "Not passed"}
        </p>
      </div>
      {hasPendingGrading ? (
        <p
          className={`text-xs rounded-xl px-3.5 py-2.5 border ${
            isVault
              ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
              : "text-amber-700 bg-amber-50 border-amber-100"
          }`}
        >
          Some short-answer responses are pending manual grading — your score may change once
          they&apos;re reviewed.
        </p>
      ) : null}
      <button
        type="button"
        onClick={onClose}
        className={`inline-flex items-center gap-2 px-4 py-2.5 text-[11px] font-mono uppercase tracking-wider rounded-xl transition ${
          isVault
            ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
            : "bg-stone-900 hover:bg-stone-800 text-white"
        }`}
      >
        Close
      </button>
    </div>
  );
}
