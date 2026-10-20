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
    <div className="rounded-2xl border border-gold/30 bg-gold/8 p-5 flex gap-3">
      <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
          Make the boundary one you can keep
        </p>
        <p className="text-sm text-ink font-light leading-relaxed">{note}</p>
      </div>
    </div>
  );
}
