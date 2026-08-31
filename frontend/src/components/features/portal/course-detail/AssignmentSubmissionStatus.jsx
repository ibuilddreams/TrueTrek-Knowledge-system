"use client";

import { CheckCircle2, Clock, Paperclip } from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";
import { useTheme } from "@/hooks/useTheme";

const STATUS_STYLES = {
  DRAFT: "bg-stone-50 text-stone-500 border-stone-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
  LATE: "bg-rose-50 text-rose-600 border-rose-100",
  GRADED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  RETURNED: "bg-sky-50 text-sky-700 border-sky-100",
  RESUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
};

const STATUS_STYLES_VAULT = {
  DRAFT: "bg-stone-500/10 text-stone-400 border-stone-500/20",
  SUBMITTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LATE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  GRADED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  RETURNED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  RESUBMITTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function AssignmentSubmissionStatus({ submission }) {
  const { isVault } = useTheme();
  const statusClass = isVault
    ? STATUS_STYLES_VAULT[submission.status] || STATUS_STYLES_VAULT.DRAFT
    : STATUS_STYLES[submission.status] || STATUS_STYLES.DRAFT;

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 ${
        isVault ? "border-stone-800 bg-white/5" : "border-stone-200 bg-stone-50/70"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h5
          className={`text-sm font-mono uppercase tracking-wider ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          Your submission
        </h5>
        <span
          className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${statusClass}`}
        >
          {submission.status}
        </span>
      </div>

      {(submission.files || []).length > 0 && (
        <div className="space-y-1.5">
          {submission.files.map((file) => (
            <a
              key={file.id}
              href={file.file}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 text-[12px] transition ${
                isVault
                  ? "text-stone-300 hover:text-amber-400"
                  : "text-stone-600 hover:text-amber-800"
              }`}
            >
              <Paperclip
                className={`w-3.5 h-3.5 shrink-0 ${isVault ? "text-stone-500" : "text-stone-400"}`}
              />
              <span className="truncate">{file.original_name || file.file}</span>
            </a>
          ))}
        </div>
      )}

      {submission.submitted_at ? (
        <div
          className={`flex items-center gap-1.5 text-xs ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Submitted {formatDateTime(submission.submitted_at)}
        </div>
      ) : null}

      {submission.status === "GRADED" && (
        <div
          className={`pt-2 border-t space-y-1.5 ${
            isVault ? "border-stone-800" : "border-stone-200"
          }`}
        >
          <div
            className={`flex items-center gap-1.5 text-sm font-serif font-bold ${
              isVault ? "text-emerald-400" : "text-emerald-700"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {submission.marks} / {submission.assignment?.total_marks ?? "—"} marks
            {submission.percentage !== null && submission.percentage !== undefined ? (
              <span
                className={`font-mono text-sm font-normal ${
                  isVault ? "text-emerald-400/80" : "text-emerald-600/80"
                }`}
              >
                ({submission.percentage}%)
              </span>
            ) : null}
          </div>
          {submission.feedback ? (
            <p className={`text-sm font-light ${isVault ? "text-stone-300" : "text-stone-600"}`}>
              {submission.feedback}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
