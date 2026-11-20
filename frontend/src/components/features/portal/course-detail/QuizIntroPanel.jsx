"use client";

import { Loader2, Play, ShieldAlert } from "lucide-react";
import { getPortalQuizStatus } from "@/lib/curriculumMeta";
import {
  PortalButton,
  PortalKv,
  PortalKvItem,
  PortalPill,
} from "../shell/PortalUI";

function formatDeadline(value) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No deadline";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function QuizIntroPanel({ quiz, canInteract, isStarting, onStart }) {
  const isUnavailable = !quiz.is_available;
  const hasInProgress = quiz.latest_attempt?.status === "IN_PROGRESS";
  const status = getPortalQuizStatus(quiz);
  // Attempts are unlimited — every attempt after the first regenerates a
  // fresh AI question set (quizzes/ai_generation.py), so there's nothing to
  // exhaust here. Only enrollment/availability can block starting.

  let disabledReason = null;
  if (!canInteract) disabledReason = "Your enrollment for this course isn't active.";
  else if (isUnavailable) disabledReason = "This quiz isn't currently available.";

  const best = quiz.latest_attempt?.percentage;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <PortalPill tone="blue">Quiz</PortalPill>
        <PortalPill tone={status.tone}>{status.label}</PortalPill>
      </div>

      <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.015em] text-cn-p-ink">
        {quiz.title}
      </h2>

      <p className="text-base text-cn-p-ink-2">
        {quiz.description ||
          `${quiz.number_of_questions} question${
            quiz.number_of_questions === 1 ? "" : "s"
          } on this module's lessons. Answer them all, then submit for an instant score.`}
      </p>

      <PortalKv>
        <PortalKvItem label="Passing score" value={`${quiz.passing_score}%`} />
        <PortalKvItem
          label="Time limit"
          value={quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "No limit"}
        />
        <PortalKvItem label="Attempts" value={quiz.attempts_used || 0} />
        <PortalKvItem
          label="Best score"
          value={best != null ? `${Math.round(Number(best))}%` : "—"}
        />
      </PortalKv>

      {quiz.available_until && (
        <p className="text-[13px] text-cn-p-ink-2">
          Available until {formatDeadline(quiz.available_until)}.
        </p>
      )}

      {hasInProgress && (
        <p className="flex items-start gap-2 rounded-xl bg-cn-p-warn-bg px-3.5 py-3 text-[13px] text-cn-p-warn">
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 flex-none" />
          <span>
            You have an attempt in progress. Continuing will resume it exactly where you left
            off — it won&apos;t count as a new attempt.
          </span>
        </p>
      )}

      {disabledReason && <p className="text-[13px] text-cn-p-bad">{disabledReason}</p>}

      <div>
        <PortalButton
          onClick={onStart}
          disabled={Boolean(disabledReason) || isStarting}
        >
          {isStarting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {hasInProgress
            ? "Resume attempt"
            : quiz.attempts_used
              ? "Start new attempt"
              : "Start attempt"}
        </PortalButton>
      </div>
    </div>
  );
}
