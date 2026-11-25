"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { CN_BTN_SECONDARY } from "@/components/ui/cobaltStyles";

/**
 * The "that didn't load" state for a wizard step, rendered in place of the
 * step's body inside `OnboardingWizard`'s card. One component rather than one
 * per step, so a failed questionnaire and a failed recommendation can't drift
 * apart.
 */
export default function OnboardingErrorPanel({ title, message, onRetry }) {
  return (
    <div className="grid justify-items-center gap-3 py-8 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-cn bg-cn-paper-3 text-cn-live">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h2 className="text-cn-xl font-extrabold tracking-[-0.02em] text-cn-ink">
        {title}
      </h2>
      <p className="max-w-[420px] text-cn-ink-2">{message}</p>
      <button type="button" onClick={onRetry} className={`${CN_BTN_SECONDARY} mt-2`}>
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}
