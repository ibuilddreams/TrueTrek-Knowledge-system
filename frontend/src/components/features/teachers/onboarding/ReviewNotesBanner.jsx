"use client";

import { MessageSquareWarning } from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";

/**
 * What the reviewer asked for, shown above the wizard when an application
 * comes back for changes. It is the only thing that tells a teacher why their
 * application reopened, so it sits above the form rather than inside a step.
 */
export default function ReviewNotesBanner({ application }) {
  if (!application.review_notes) return null;

  return (
    <div className="p-5 rounded-card bg-gold/10 border border-gold/25">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 shrink-0 rounded-lg bg-paper border border-gold/25 text-gold flex items-center justify-center">
          <MessageSquareWarning className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold font-sans text-ink">
            The review team asked for some changes
          </h3>
          <p className="text-sm text-muted font-light leading-relaxed mt-2 whitespace-pre-wrap">
            {application.review_notes}
          </p>
          <p className="text-[11px] font-mono text-muted mt-3">
            {application.reviewed_by?.name ? `${application.reviewed_by.name} · ` : ""}
            {formatDateTime(application.reviewed_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
