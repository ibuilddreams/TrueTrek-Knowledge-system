"use client";

import { AlertCircle, Check, Loader2, Send } from "lucide-react";
import ApplicationSummary from "./ApplicationSummary";
import { PRIMARY_BUTTON_CLASS } from "./fieldStyles";

/**
 * Step 5 — what the review team will see, and the one button that sends it.
 *
 * The checklist is `missing_requirements` straight from the server, which is
 * also what the submit endpoint refuses on: the screen can never offer a
 * submit the server then rejects, and it can never hide one it would accept.
 */
export default function ReviewSubmitStep({ application, onSubmit, isSubmitting }) {
  const missing = application.missing_requirements || [];
  const isComplete = missing.length === 0;

  return (
    <div className="space-y-6">
      {isComplete ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-sage/30 border border-pine/20">
          <Check className="w-4 h-4 text-pine shrink-0 mt-0.5" />
          <p className="text-sm text-pine font-light leading-relaxed">
            Your application is complete. Once you send it, the review team will read it and you
            will hear back by email — you cannot edit it while it is with them.
          </p>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-gold/10 border border-gold/25">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-gold shrink-0" />
            <p className="text-sm font-semibold font-sans text-ink">
              {missing.length} thing{missing.length === 1 ? "" : "s"} still to do
            </p>
          </div>
          <ul className="space-y-1.5 pl-6 list-disc marker:text-gold">
            {missing.map((item) => (
              <li key={item} className="text-sm text-muted font-light leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-5 bg-paper border border-line rounded-card">
        <h3 className="text-sm font-semibold font-sans text-ink mb-1">Your application</h3>
        <ApplicationSummary application={application} />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!isComplete || isSubmitting}
          title={isComplete ? "Send for review" : "Finish the checklist above first"}
          className={PRIMARY_BUTTON_CLASS}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Submit for Review
            </>
          )}
        </button>
      </div>
    </div>
  );
}
