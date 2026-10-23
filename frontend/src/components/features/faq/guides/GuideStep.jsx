"use client";

import { Lightbulb, Navigation } from "lucide-react";

/**
 * One numbered step on a chapter's timeline. The connector rail is drawn by the
 * step itself rather than the parent so the last step can stop it cleanly.
 */
export default function GuideStep({ step, index, isLast }) {
  return (
    <li className="relative flex gap-4 md:gap-5">
      {/* Number + connector rail */}
      <div className="relative flex flex-col items-center shrink-0">
        <span className="relative z-10 w-9 h-9 rounded-full bg-paper border border-gold/35 text-gold font-sans text-xs font-bold flex items-center justify-center shadow-soft">
          {String(index + 1).padStart(2, "0")}
        </span>
        {!isLast && (
          <span
            aria-hidden="true"
            className="w-px flex-1 mt-1 bg-gradient-to-b from-gold/30 via-line to-transparent"
          />
        )}
      </div>

      <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-7"}`}>
        <h4 className="font-serif text-base md:text-lg font-light tracking-tight text-ink leading-snug">
          {step.title}
        </h4>

        {step.where && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-porcelain border border-line px-2.5 py-1 font-sans text-[11px] font-medium text-muted">
            <Navigation className="w-3 h-3 text-pine shrink-0" />
            {step.where}
          </span>
        )}

        <p className="mt-2.5 font-sans text-sm text-muted leading-relaxed">
          {step.body}
        </p>

        {step.tip && (
          <div className="mt-3 flex gap-2.5 rounded-xl bg-gold/[0.07] border border-gold/20 px-3.5 py-3">
            <Lightbulb className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <p className="font-sans text-[13px] text-ink/75 leading-relaxed">
              <span className="font-semibold text-ink">Tip &middot; </span>
              {step.tip}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}
