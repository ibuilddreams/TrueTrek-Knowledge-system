"use client";

import { CheckCircle2, Clock, Loader2, Paperclip, RefreshCw, Sparkles } from "lucide-react";
import { formatDateTime } from "@/lib/adminFormatters";
import { useRetryAiReview } from "@/hooks/student/useAssignmentSubmission";
import { PortalButton, PortalPill, PortalSectionLabel } from "../shell/PortalUI";

// Each submission state as one of the design's own pill tones.
const STATUS_TONES = {
  DRAFT: "neutral",
  SUBMITTED: "blue",
  LATE: "bad",
  GRADED: "ok",
  RETURNED: "blue",
  RESUBMITTED: "blue",
};

const AI_REVIEW_TONES = {
  COMPLETED: "ok",
  FAILED: "bad",
  PROCESSING: "blue",
};

function AiReviewPanel({ assignmentId, aiReview, totalMarks }) {
  const retryMutation = useRetryAiReview(assignmentId);

  if (!aiReview || aiReview.status === "PENDING") return null;

  const isProcessing = aiReview.status === "PROCESSING";
  const isFailed = aiReview.status === "FAILED";
  const isCompleted = aiReview.status === "COMPLETED";

  const badgeKey = isProcessing ? "PROCESSING" : isFailed ? "FAILED" : "COMPLETED";
  const badgeTone = AI_REVIEW_TONES[badgeKey] || "blue";
  const badgeLabel = isProcessing
    ? "Grading in Progress"
    : isFailed
      ? "Grading Unavailable"
      : "Graded by Elite Coach";

  return (
    <div className="flex flex-col gap-2.5 border-t border-cn-p-line pt-3">
      <div className="flex items-center justify-between gap-3">
        <PortalSectionLabel className="inline-flex items-center gap-1.5 px-0 pt-0">
          <Sparkles className="h-3.5 w-3.5" />
          Elite Coach grading
        </PortalSectionLabel>
        <PortalPill tone={badgeTone}>
          {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
          {badgeLabel}
        </PortalPill>
      </div>

      {isFailed && (
        <div className="space-y-2">
          <p className="text-sm text-cn-p-ink-2">
            Submission saved — grading is taking longer than expected or is temporarily
            unavailable. Please try again shortly.
          </p>
          <PortalButton
            variant="sec"
            size="sm"
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
            className="self-start"
          >
            {retryMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Retry grading
          </PortalButton>
        </div>
      )}

      {isCompleted && (
        <div className="space-y-2">
          {aiReview.score !== null && aiReview.score !== undefined ? (
            <div className="flex items-center gap-1.5 font-bold text-cn-p-ok">
              <CheckCircle2 className="h-4 w-4" />
              {totalMarks
                ? `${Math.round((Number(aiReview.score) / 100) * totalMarks)} / ${totalMarks} marks`
                : "Score"}
              <span className="text-sm font-normal tabular-nums text-cn-p-ok">
                ({Math.round(Number(aiReview.score))}%)
              </span>
            </div>
          ) : null}

          {Array.isArray(aiReview.criteria_results) && aiReview.criteria_results.length > 0 ? (
            <ul className="flex flex-col gap-0.5 text-sm text-cn-p-ink-2">
              {aiReview.criteria_results.map((item, index) => (
                <li key={index} className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span className="shrink-0 text-xs tabular-nums">
                    {item.awarded_marks} / {item.max_marks}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {aiReview.feedback ? (
            <p className="text-sm text-cn-p-ink-2">{aiReview.feedback}</p>
          ) : null}

          {Array.isArray(aiReview.strengths) && aiReview.strengths.length > 0 ? (
            <div>
              <PortalSectionLabel className="px-0 pt-0">Strengths</PortalSectionLabel>
              <ul className="flex flex-col gap-0.5 text-sm text-cn-p-ink-2">
                {aiReview.strengths.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {Array.isArray(aiReview.improvements) && aiReview.improvements.length > 0 ? (
            <div>
              <PortalSectionLabel className="px-0 pt-0">Areas to improve</PortalSectionLabel>
              <ul className="flex flex-col gap-0.5 text-sm text-cn-p-ink-2">
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
  const statusTone = STATUS_TONES[submission.status] || "neutral";
  const isAiGraded = submission.assignment?.grading_mode === "AI";
  // A teacher/admin can manually override an AI-graded submission's marks
  // (GradeSubmissionModal) without creating a new AI review row, so the
  // AiReviewPanel below can be showing a stale AI verdict once that happens
  // — always surface the authoritative marks/feedback once a human has
  // graded it, not just for MANUAL-mode assignments.
  const isManuallyGraded = Boolean(submission.graded_by);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-cn-p-line bg-cn-p-page p-4">
      <div className="flex items-center justify-between gap-3">
        <PortalSectionLabel className="px-0 pt-0">Your submission</PortalSectionLabel>
        <PortalPill tone={statusTone}>{submission.status}</PortalPill>
      </div>

      {(submission.files || []).length > 0 && (
        <div className="space-y-1.5">
          {submission.files.map((file) => (
            <a
              key={file.id}
              href={file.file}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[13px] text-cn-p-ink-2 transition-colors duration-150 hover:text-cn-p-accent"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{file.original_name || file.file}</span>
            </a>
          ))}
        </div>
      )}

      {submission.submitted_at ? (
        <div className="flex items-center gap-1.5 text-xs text-cn-p-ink-2">
          <Clock className="h-3.5 w-3.5" />
          Submitted {formatDateTime(submission.submitted_at)}
        </div>
      ) : null}

      {(!isAiGraded || isManuallyGraded) && submission.status === "GRADED" && (
        <div className="flex flex-col gap-1.5 border-t border-cn-p-line pt-2">
          <div className="flex items-center gap-1.5 font-bold text-cn-p-ok">
            <CheckCircle2 className="h-4 w-4" />
            {submission.marks} / {submission.assignment?.total_marks ?? "—"} marks
            {submission.percentage !== null && submission.percentage !== undefined ? (
              <span className="text-sm font-normal tabular-nums text-cn-p-ok">
                ({submission.percentage}%)
              </span>
            ) : null}
          </div>
          {submission.feedback ? (
            <p className="text-sm text-cn-p-ink-2">{submission.feedback}</p>
          ) : null}
        </div>
      )}

      {isAiGraded ? (
        <AiReviewPanel
          assignmentId={submission.assignment?.id}
          aiReview={submission.ai_review}
          totalMarks={submission.assignment?.total_marks}
        />
      ) : null}
    </div>
  );
}
