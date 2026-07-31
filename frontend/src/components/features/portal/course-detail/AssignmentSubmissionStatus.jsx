"use client";

import { CheckCircle2, Clock, Paperclip } from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";

const STATUS_STYLES = {
  DRAFT: "bg-stone-50 text-stone-500 border-stone-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
  LATE: "bg-rose-50 text-rose-600 border-rose-100",
  GRADED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  RETURNED: "bg-sky-50 text-sky-700 border-sky-100",
  RESUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function AssignmentSubmissionStatus({ submission }) {
  const statusClass = STATUS_STYLES[submission.status] || STATUS_STYLES.DRAFT;

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h5 className="text-xs font-mono uppercase tracking-wider text-stone-400">
          Your submission
        </h5>
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${statusClass}`}
        >
          {submission.status}
        </span>
      </div>

      {submission.submission_text ? (
        <p className="text-sm text-stone-700 font-light whitespace-pre-line">
          {submission.submission_text}
        </p>
      ) : null}

      {(submission.files || []).length > 0 && (
        <div className="space-y-1.5">
          {submission.files.map((file) => (
            <a
              key={file.id}
              href={file.file}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] text-stone-600 hover:text-amber-800 transition"
            >
              <Paperclip className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{file.original_name || file.file}</span>
            </a>
          ))}
        </div>
      )}

      {submission.submitted_at ? (
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
          <Clock className="w-3.5 h-3.5" />
          Submitted {formatDateTime(submission.submitted_at)}
        </div>
      ) : null}

      {submission.status === "GRADED" && (
        <div className="pt-2 border-t border-stone-200 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-serif font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            {submission.marks} / {submission.assignment?.total_marks ?? "—"} marks
          </div>
          {submission.feedback ? (
            <p className="text-xs text-stone-600 font-light">{submission.feedback}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
