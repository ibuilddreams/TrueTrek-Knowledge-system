"use client";

import { CheckCircle2, Clock, Loader2, Paperclip, RefreshCw, Sparkles } from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";
import { useTheme } from "@/hooks/useTheme";
import { useRetryAiReview } from "@/hooks/student/useAssignmentSubmission";

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

// AI grading status pill is intentionally hand-rolled to match this file's
// existing STATUS_STYLES convention rather than the shared StatusBadge
// component — see PROJECT.md's frontend notes on this inconsistency.
const AI_REVIEW_STYLES = {
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  FAILED: "bg-rose-50 text-rose-600 border-rose-100",
  PROCESSING: "bg-sky-50 text-sky-700 border-sky-100",
};

const AI_REVIEW_STYLES_VAULT = {
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  FAILED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  PROCESSING: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

function AiReviewPanel({ assignmentId, aiReview, totalMarks, isVault }) {
  const retryMutation = useRetryAiReview(assignmentId);

  if (!aiReview || aiReview.status === "PENDING") return null;

  const isProcessing = aiReview.status === "PROCESSING";
  const isFailed = aiReview.status === "FAILED";
  const isCompleted = aiReview.status === "COMPLETED";

  const badgeKey = isProcessing ? "PROCESSING" : isFailed ? "FAILED" : "COMPLETED";
  const badgeClass = isVault
    ? AI_REVIEW_STYLES_VAULT[badgeKey] || AI_REVIEW_STYLES_VAULT.PROCESSING
    : AI_REVIEW_STYLES[badgeKey] || AI_REVIEW_STYLES.PROCESSING;
  const badgeLabel = isProcessing
    ? "Grading in Progress"
    : isFailed
      ? "Grading Unavailable"
      : "Graded by Elite Coach";

  return (
    <div
      className={`pt-3 border-t space-y-2.5 ${isVault ? "border-stone-800" : "border-stone-200"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h6
          className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Elite Coach Grading
        </h6>
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${badgeClass}`}
        >
          {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
          {badgeLabel}
        </span>
      </div>

      {isFailed && (
        <div className="space-y-2">
          <p className={`text-sm font-light ${isVault ? "text-stone-300" : "text-stone-600"}`}>
            Submission Saved — grading is taking longer than expected or is temporarily
            unavailable. Please try again shortly.
          </p>
          <button
            type="button"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50 text-[11px] font-mono uppercase tracking-wider rounded-lg border transition ${
              isVault
                ? "border-stone-700 hover:border-amber-500/60 text-stone-400 hover:text-amber-400"
                : "border-stone-300 hover:border-amber-400 text-stone-500 hover:text-amber-700"
            }`}
          >
            {retryMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            Retry Grading
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="space-y-2">
          {aiReview.score !== null && aiReview.score !== undefined ? (
            <div
              className={`flex items-center gap-1.5 text-sm font-serif font-bold ${
                isVault ? "text-emerald-400" : "text-emerald-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {totalMarks
                ? `${Math.round((Number(aiReview.score) / 100) * totalMarks)} / ${totalMarks} marks`
                : "Score"}
              <span
                className={`font-mono text-sm font-normal ${
                  isVault ? "text-emerald-400/80" : "text-emerald-600/80"
                }`}
              >
                ({Math.round(Number(aiReview.score))}%)
              </span>
            </div>
          ) : null}

          {Array.isArray(aiReview.criteria_results) && aiReview.criteria_results.length > 0 ? (
            <ul className={`text-sm font-light space-y-0.5 ${isVault ? "text-stone-300" : "text-stone-600"}`}>
              {aiReview.criteria_results.map((item, index) => (
                <li key={index} className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span className="font-mono text-xs shrink-0">
                    {item.awarded_marks} / {item.max_marks}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {aiReview.feedback ? (
            <p className={`text-sm font-light ${isVault ? "text-stone-300" : "text-stone-600"}`}>
              {aiReview.feedback}
            </p>
          ) : null}

          {Array.isArray(aiReview.strengths) && aiReview.strengths.length > 0 ? (
            <div>
              <p
                className={`text-[11px] font-mono uppercase tracking-wider mb-1 ${
                  isVault ? "text-stone-500" : "text-stone-400"
                }`}
              >
                Strengths
              </p>
              <ul className={`text-sm font-light space-y-0.5 ${isVault ? "text-stone-300" : "text-stone-600"}`}>
                {aiReview.strengths.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(aiReview.improvements) && aiReview.improvements.length > 0 ? (
            <div>
              <p
                className={`text-[11px] font-mono uppercase tracking-wider mb-1 ${
                  isVault ? "text-stone-500" : "text-stone-400"
                }`}
              >
                Areas to improve
              </p>
              <ul className={`text-sm font-light space-y-0.5 ${isVault ? "text-stone-300" : "text-stone-600"}`}>
                {aiReview.improvements.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function AssignmentSubmissionStatus({ submission }) {
  const { isVault } = useTheme();
  const statusClass = isVault
    ? STATUS_STYLES_VAULT[submission.status] || STATUS_STYLES_VAULT.DRAFT
    : STATUS_STYLES[submission.status] || STATUS_STYLES.DRAFT;
  const isAiGraded = submission.assignment?.grading_mode === "AI";
  // A teacher/admin can manually override an AI-graded submission's marks
  // (GradeSubmissionModal) without creating a new AI review row, so the
  // AiReviewPanel below can be showing a stale AI verdict once that happens
  // — always surface the authoritative marks/feedback once a human has
  // graded it, not just for MANUAL-mode assignments.
  const isManuallyGraded = Boolean(submission.graded_by);

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

      {(!isAiGraded || isManuallyGraded) && submission.status === "GRADED" && (
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

      {isAiGraded ? (
        <AiReviewPanel
          assignmentId={submission.assignment?.id}
          aiReview={submission.ai_review}
          totalMarks={submission.assignment?.total_marks}
          isVault={isVault}
        />
      ) : null}
    </div>
  );
}
