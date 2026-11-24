"use client";

import { AlertTriangle } from "lucide-react";

/**
 * The module's standing coaching point, shown only when the grader caught it:
 * a boundary built on an invented authority buys one conversation and
 * collapses the next.
 *
 * Deliberately outside the three rubric cards. It is advice, not a fourth
 * score — the backend scores the criteria on their own terms and lets this
 * flag carry the lesson, so nothing is deducted twice.
 */
export default function CoachingNote({ note }) {
  if (!note) return null;

  return (
    <div className="rounded-2xl border border-cn-p-warn-bg bg-cn-p-warn-bg p-5 flex gap-3">
      <AlertTriangle className="w-4 h-4 text-cn-p-warn shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-cn-p-ink-2 mb-1">
          Make the boundary one you can keep
        </p>
        <p className="text-sm text-cn-p-ink font-light leading-relaxed">{note}</p>
      </div>
    </div>
  );
}
