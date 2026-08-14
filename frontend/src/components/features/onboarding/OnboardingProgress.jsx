"use client";

export default function OnboardingProgress({ steps, activeIndex }) {
  return (
    <div
      className="flex items-start justify-between gap-1 mb-8"
      aria-label="Onboarding progress"
    >
      {steps.map((step, index) => {
        const isComplete = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <div key={step.key} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full flex items-center">
              {index > 0 && (
                <div
                  className={`h-px flex-1 transition-colors ${
                    isComplete || isActive ? "bg-amber-600" : "bg-stone-200"
                  }`}
                />
              )}
              <div
                className={`w-2.5 h-2.5 rounded-full mx-1.5 shrink-0 transition-colors ${
                  isComplete
                    ? "bg-amber-600"
                    : isActive
                      ? "bg-amber-600 ring-4 ring-amber-600/20"
                      : "bg-stone-300"
                }`}
              />
              {index < steps.length - 1 && (
                <div
                  className={`h-px flex-1 transition-colors ${
                    isComplete ? "bg-amber-600" : "bg-stone-200"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-[9px] font-mono uppercase tracking-wider text-center ${
                isActive ? "text-stone-900 font-bold" : "text-stone-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
