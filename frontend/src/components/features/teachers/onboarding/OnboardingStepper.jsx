"use client";

import { Check } from "lucide-react";

/**
 * The wizard's progress rail. Shaped like the student wizard's
 * `features/onboarding/OnboardingProgress`, but drawn in the portal's own
 * pine/gold palette rather than the marketing flow's amber, because this one
 * is rendered inside the Faculty Portal.
 *
 * Completed steps are clickable so a teacher can go back and change an answer
 * without walking forward through the whole wizard again; steps ahead are not,
 * since each one is saved as it is left.
 */
export default function OnboardingStepper({ steps, activeIndex, onStepSelect, disabled = false }) {
  return (
    <ol className="flex items-start justify-between gap-1" aria-label="Application progress">
      {steps.map((step, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;
        const canSelect = Boolean(onStepSelect) && isComplete && !disabled;

        return (
          <li key={step.key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div className="w-full flex items-center">
              <span
                className={`h-px flex-1 transition-colors ${
                  index === 0 ? "bg-transparent" : isComplete || isActive ? "bg-pine" : "bg-line"
                }`}
              />
              <button
                type="button"
                onClick={canSelect ? () => onStepSelect(index) : undefined}
                disabled={!canSelect}
                aria-current={isActive ? "step" : undefined}
                title={canSelect ? `Back to ${step.label}` : step.label}
                className={`w-7 h-7 mx-1.5 shrink-0 rounded-full border flex items-center justify-center text-[10px] font-mono transition ${
                  isComplete
                    ? "bg-pine border-pine text-paper"
                    : isActive
                      ? "bg-paper border-pine text-pine ring-4 ring-pine/15"
                      : "bg-paper border-line text-muted"
                } ${canSelect ? "cursor-pointer hover:bg-moss hover:border-moss" : "cursor-default"}`}
              >
                {isComplete ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </button>
              <span
                className={`h-px flex-1 transition-colors ${
                  index === steps.length - 1 ? "bg-transparent" : isComplete ? "bg-pine" : "bg-line"
                }`}
              />
            </div>
            <span
              className={`text-[9px] sm:text-[10px] font-sans uppercase tracking-widest text-center truncate w-full ${
                isActive ? "text-ink font-semibold" : "text-muted"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
