"use client";

import { Sparkles } from "lucide-react";
import { PortalKicker, PortalPill } from "../shell/PortalUI";

const DIFFICULTY_LABELS = { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" };

// The design's drill card: what kind of exercise this is, the situation, the
// goal, then the options as `.opt` buttons — a lettered key beside the move.
//
// The dark scenario panel the old card used is gone. The design states the
// case as plain prose at `--text-xl`, which is what a reader is actually
// being asked to think about; inverting it made it a decorative banner.
export default function AIQuestionDrillCard({ data, onSubmit, isSubmitting }) {
  const attempted = data.attempted;
  const selectedKey = data.selected_key;
  const isCorrect = attempted && selectedKey === data.correct_answer;

  return (
    <div className="flex flex-col gap-[18px] rounded-cn-p border border-cn-p-line bg-cn-p-card p-8">
      <div className="flex flex-wrap items-center gap-2">
        <PortalPill tone="blue">
          <Sparkles className="h-3.5 w-3.5" />
          AI-personalised drill
        </PortalPill>
        {data.difficulty && (
          <PortalPill>{DIFFICULTY_LABELS[data.difficulty] || data.difficulty}</PortalPill>
        )}
        {data.topic && <PortalPill>{data.topic}</PortalPill>}
        <span className="text-sm text-cn-p-muted">
          {attempted ? "Completed today" : "Today's exercise"}
        </span>
      </div>

      <h3 className="text-[22px] leading-[1.4] font-bold text-cn-p-ink">
        {data.question}
      </h3>

      {data.context && (
        <p className="text-sm text-cn-p-ink-2">
          <b className="font-semibold text-cn-p-ink">Goal:</b> {data.context}
        </p>
      )}

      <PortalKicker>Select your action</PortalKicker>

      <div className="flex flex-col gap-2.5">
        {data.options.map((option) => {
          const isChosen = attempted && option.key === selectedKey;
          const isRight = attempted && option.key === data.correct_answer;
          return (
            <button
              key={option.key}
              type="button"
              aria-pressed={isChosen}
              disabled={attempted || isSubmitting}
              onClick={() => onSubmit(option.key)}
              className={`flex w-full items-start gap-3.5 rounded-xl border-[1.5px] p-4 text-left transition-[border-color,background-color] duration-150 disabled:cursor-default ${
                isRight
                  ? "border-cn-p-ok bg-cn-p-ok-bg"
                  : isChosen
                    ? "border-cn-p-bad bg-cn-p-bad-bg"
                    : "border-cn-p-line bg-cn-p-card enabled:hover:border-cn-p-accent-soft"
              }`}
            >
              <span
                className={`grid h-[30px] w-[30px] flex-none place-items-center rounded-lg font-bold ${
                  isRight
                    ? "bg-cn-p-ok text-white"
                    : isChosen
                      ? "bg-cn-p-bad text-white"
                      : "bg-cn-p-neutral-bg text-cn-p-ink"
                }`}
              >
                {option.key}
              </span>
              <span className="flex-1 pt-1 text-sm leading-relaxed font-medium text-cn-p-ink">
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* The design's `.callout`: the verdict and the reasoning in one band,
          tinted green when the move was the strong one. */}
      {attempted && (
        <div
          className={`rounded-xl px-[18px] py-4 font-medium ${
            isCorrect
              ? "bg-cn-p-ok-bg text-cn-p-ok"
              : "bg-cn-p-soft text-cn-p-soft-ink"
          }`}
        >
          <b className="font-bold">
            {isCorrect
              ? `Strong move.${data.points_awarded > 0 ? ` +${data.points_awarded} pts.` : ""}`
              : "Not the best move."}
          </b>{" "}
          {data.explanation ||
            (isCorrect
              ? "A new drill arrives tomorrow."
              : "No points this time — a new drill arrives tomorrow.")}
        </div>
      )}

      {!attempted && (
        <span className="text-sm text-cn-p-muted">
          {isSubmitting
            ? "Submitting your answer..."
            : "This drill was generated for you from your recent learning activity."}
        </span>
      )}
    </div>
  );
}
