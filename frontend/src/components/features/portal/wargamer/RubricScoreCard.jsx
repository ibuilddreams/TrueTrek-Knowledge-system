"use client";

import { getScoreBarTone, getScoreTone } from "./wargamerConstants";

/**
 * One of the brief's three criteria, with the grader's evidence underneath.
 *
 * The backend sends these pre-paired as an ordered `rubric` array, so the
 * label, the score and the note can never drift apart here.
 */
export default function RubricScoreCard({ criterion, caption }) {
  const score = criterion.score ?? 0;

  return (
    <div className="bg-paper border border-line rounded-2xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-sm font-serif font-bold text-ink leading-snug">{criterion.label}</h4>
        <span className={`text-2xl font-serif font-light tabular-nums ${getScoreTone(score)}`}>
          {score}
          <span className="text-[10px] font-mono text-muted ml-1">/100</span>
        </span>
      </div>

      <div
        className="h-1.5 w-full rounded-full bg-porcelain overflow-hidden"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${criterion.label} score`}
      >
        <div
          className={`h-full rounded-full ${getScoreBarTone(score)}`}
          style={{ width: `${Math.max(0, Math.min(100, score))}%`, transition: "width 800ms ease-out" }}
        />
      </div>

      {criterion.note && (
        <p className="text-xs text-muted font-light leading-relaxed">{criterion.note}</p>
      )}
      {caption && (
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted mt-auto pt-1">
          {caption}
        </p>
      )}
    </div>
  );
}
