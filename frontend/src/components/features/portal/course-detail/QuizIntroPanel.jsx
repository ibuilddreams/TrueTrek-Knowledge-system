"use client";

import { Loader2, PlayCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";
import { useTheme } from "@/hooks/useTheme";
import { useRequestQuizSelfRetry } from "@/hooks/student/useQuizAttempt";

function InfoChip({ label, value, isVault }) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        isVault ? "border-stone-800 bg-white/5" : "border-stone-100 bg-stone-50/80"
      }`}
    >
      <p className={`text-[10px] font-mono uppercase tracking-wider ${isVault ? "text-stone-500" : "text-stone-400"}`}>
        {label}
      </p>
      <p className={`text-sm font-serif font-bold mt-0.5 ${isVault ? "text-stone-50" : "text-stone-900"}`}>
        {value}
      </p>
    </div>
  );
}

export default function QuizIntroPanel({ quiz, canInteract, isStarting, onStart }) {
  const { isVault } = useTheme();
  const attemptsRemaining = Math.max(0, (quiz.attempts_allowed || 0) - (quiz.attempts_used || 0));
  const isExhausted = attemptsRemaining <= 0;
  const isUnavailable = !quiz.is_available;
  const hasInProgress = quiz.latest_attempt?.status === "IN_PROGRESS";
  const hasPassed = quiz.latest_attempt?.is_passed === true;
  // Task 18 (Phase 5) follow-up — once every attempt is used without
  // passing, the student isn't stuck waiting on a teacher: they can request
  // one more attempt themselves. Not offered once they've already passed
  // (retrying then would serve no purpose) or while enrollment/availability
  // itself is the blocker (an extra attempt wouldn't fix either of those).
  const canSelfRetry = isExhausted && !hasPassed && canInteract && !isUnavailable;

  const selfRetryMutation = useRequestQuizSelfRetry();

  let disabledReason = null;
  if (!canInteract) disabledReason = "Your enrollment for this course isn't active.";
  else if (isUnavailable) disabledReason = "This quiz isn't currently available.";
  else if (isExhausted && hasPassed) disabledReason = "You've already passed this quiz.";
  else if (isExhausted) disabledReason = `You've used all ${quiz.attempts_allowed} allowed attempts.`;

  return (
    <div className="space-y-5">
      {quiz.description ? (
        <p className={`text-sm font-light leading-relaxed ${isVault ? "text-stone-300" : "text-stone-600"}`}>
          {quiz.description}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5">
        <InfoChip label="Passing score" value={`${quiz.passing_score}%`} isVault={isVault} />
        <InfoChip
          label="Time limit"
          value={quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "No limit"}
          isVault={isVault}
        />
        <InfoChip label="Attempts" value={`${quiz.attempts_used}/${quiz.attempts_allowed}`} isVault={isVault} />
        <InfoChip
          label="Available until"
          value={quiz.available_until ? formatDateTime(quiz.available_until) : "No deadline"}
          isVault={isVault}
        />
      </div>

      {hasInProgress && !isExhausted ? (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${
            isVault
              ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
              : "border-amber-100 bg-amber-50 text-amber-800"
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            You have an attempt in progress. Continuing will resume it exactly where you left
            off — it won&apos;t count as a new attempt.
          </span>
        </div>
      ) : null}

      {disabledReason ? (
        <p className={`text-sm ${isVault ? "text-rose-400" : "text-rose-600"}`}>{disabledReason}</p>
      ) : null}

      {canSelfRetry ? (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm ${
            isVault
              ? "border-sky-500/20 bg-sky-500/10 text-sky-300"
              : "border-sky-100 bg-sky-50 text-sky-800"
          }`}
        >
          <RefreshCw className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Review this module&apos;s lessons, then request another attempt below to keep
            trying and pass this quiz.
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onStart}
          disabled={Boolean(disabledReason) || isStarting}
          className={`inline-flex items-center gap-2 px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono uppercase tracking-wider rounded-xl transition ${
            isVault
              ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
              : "bg-stone-900 hover:bg-stone-800 text-white"
          }`}
        >
          {isStarting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <PlayCircle className="w-3.5 h-3.5" />
          )}
          {hasInProgress && !isExhausted ? "Resume attempt" : "Start attempt"}
        </button>

        {canSelfRetry ? (
          <button
            type="button"
            onClick={() => selfRetryMutation.mutate(quiz.id)}
            disabled={selfRetryMutation.isPending}
            className={`inline-flex items-center gap-2 px-4 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono uppercase tracking-wider rounded-xl border transition ${
              isVault
                ? "border-amber-600/50 text-amber-400 hover:bg-amber-500/10"
                : "border-stone-300 text-stone-700 hover:bg-stone-50"
            }`}
          >
            {selfRetryMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Request another attempt
          </button>
        ) : null}
      </div>
    </div>
  );
}
