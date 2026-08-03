"use client";

import { Loader2, PlayCircle, ShieldAlert } from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";

function InfoChip({ label, value }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2.5">
      <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">{label}</p>
      <p className="text-sm font-serif font-bold text-stone-900 mt-0.5">{value}</p>
    </div>
  );
}

export default function QuizIntroPanel({ quiz, canInteract, isStarting, onStart }) {
  const attemptsRemaining = Math.max(0, (quiz.attempts_allowed || 0) - (quiz.attempts_used || 0));
  const isExhausted = attemptsRemaining <= 0;
  const isUnavailable = !quiz.is_available;
  const hasInProgress = quiz.latest_attempt?.status === "IN_PROGRESS";

  let disabledReason = null;
  if (!canInteract) disabledReason = "Your enrollment for this course isn't active.";
  else if (isUnavailable) disabledReason = "This quiz isn't currently available.";
  else if (isExhausted) disabledReason = `You've used all ${quiz.attempts_allowed} allowed attempts.`;

  return (
    <div className="space-y-5">
      {quiz.description ? (
        <p className="text-sm text-stone-600 font-light leading-relaxed">{quiz.description}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5">
        <InfoChip label="Passing score" value={`${quiz.passing_score}%`} />
        <InfoChip
          label="Time limit"
          value={quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "No limit"}
        />
        <InfoChip label="Attempts" value={`${quiz.attempts_used}/${quiz.attempts_allowed}`} />
        <InfoChip
          label="Available until"
          value={quiz.available_until ? formatDateTime(quiz.available_until) : "No deadline"}
        />
      </div>

      {hasInProgress && !isExhausted ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            You have an attempt in progress. Continuing will resume it exactly where you left
            off — it won&apos;t count as a new attempt.
          </span>
        </div>
      ) : null}

      {disabledReason ? <p className="text-xs text-rose-600">{disabledReason}</p> : null}

      <button
        type="button"
        onClick={onStart}
        disabled={Boolean(disabledReason) || isStarting}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
      >
        {isStarting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <PlayCircle className="w-3.5 h-3.5" />
        )}
        {hasInProgress && !isExhausted ? "Resume attempt" : "Start attempt"}
      </button>
    </div>
  );
}
