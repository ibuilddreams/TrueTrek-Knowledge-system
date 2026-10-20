"use client";

import { ABP_STEPS } from "./wargamerConstants";

/**
 * The model answer for this exact situation, revealed only now.
 *
 * The backend withholds it until a run is COMPLETED (see
 * wargamer/serializers.py), which is why this component never renders before
 * a score exists — reading it beforehand would turn the exercise into
 * transcription.
 */
export default function IdealResponsePanel({ idealResponse }) {
  if (!idealResponse) return null;

  const rows = ABP_STEPS.map((step) => ({
    ...step,
    text: idealResponse[step.key],
  })).filter((row) => row.text);

  if (rows.length === 0) return null;

  return (
    <div className="bg-paper border border-line rounded-2xl shadow-sm p-5">
      <h3 className="text-sm font-serif font-bold text-ink mb-1">
        How the method handles this one
      </h3>
      <p className="text-xs text-muted font-light mb-4 leading-relaxed">
        Not a script to memorise &mdash; a reference for what each move sounds like in this
        situation.
      </p>

      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.key} className="flex gap-3">
            <span className="w-7 h-7 shrink-0 rounded-lg bg-pine text-paper font-serif font-bold text-sm flex items-center justify-center">
              {row.letter}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                {row.label}
              </p>
              <p className="text-sm text-ink font-light italic leading-relaxed mt-0.5">
                &ldquo;{row.text}&rdquo;
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
