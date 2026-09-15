"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, ClipboardList, Download, Paperclip } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { getAssignmentAttachments } from "@/services/assignmentsService";
import { formatDateTime } from "@/lib/adminFormatters";
import { useMyAssignmentSubmission } from "@/hooks/student/useAssignmentSubmission";
import AssignmentSubmissionForm from "../course-detail/AssignmentSubmissionForm";
import AssignmentSubmissionStatus from "../course-detail/AssignmentSubmissionStatus";

export default function AssignmentPlayerPanel({ assignment, canInteract }) {
  const assignmentId = assignment.id;

  const { data: attachments = [] } = useQuery({
    queryKey: ["assignmentAttachments", assignmentId],
    queryFn: async () => {
      const response = await getAssignmentAttachments(assignmentId);
      return response?.data || [];
    },
    enabled: Boolean(assignmentId),
  });

  const { data: submission, isLoading: isLoadingSubmission } = useMyAssignmentSubmission(
    assignmentId
  );

  const isPastDue = new Date(assignment.due_date) < new Date();
  const canSubmit =
    canInteract && (!isPastDue || !submission || Boolean(assignment.allow_resubmission));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-xl border shrink-0 bg-gold/12 text-gold border-gold/25">
          <ClipboardList className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-mono uppercase tracking-[0.16em] mb-1 text-gold/80">
            Assignment
          </p>
          <h2 className="font-serif font-bold text-xl sm:text-2xl leading-tight text-ink">
            {assignment.title}
          </h2>
          <p className="text-sm mt-1 text-muted">
            Due {formatDateTime(assignment.due_date)} · {assignment.total_marks} marks
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-light leading-relaxed whitespace-pre-line text-muted">
          {assignment.description || "No instructions have been added for this assignment."}
        </p>
        <div className="flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
              isPastDue
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-porcelain text-muted border-line"
            }`}
          >
            <Calendar className="w-3 h-3" />
            Due {formatDateTime(assignment.due_date)}
          </span>
          {assignment.allow_resubmission ? (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-lg border bg-gold/12 text-gold border-gold/25"
            >
              Resubmission allowed
            </span>
          ) : null}
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-mono uppercase tracking-wider text-muted">
            Reference materials
          </h5>
          <div className="space-y-1.5">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between gap-2 text-[12px] border rounded-lg px-3 py-2 text-muted bg-porcelain border-line"
              >
                <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                  <Paperclip className="w-3.5 h-3.5 shrink-0 text-muted" />
                  <span className="truncate">{attachment.original_name || attachment.file}</span>
                </span>
                <a
                  href={attachment.file}
                  download={attachment.original_name || true}
                  className="inline-flex items-center gap-1 px-2.5 py-1 border text-[11px] font-mono uppercase tracking-wider rounded-md transition shrink-0 border-line hover:border-pine hover:bg-paper text-muted hover:text-pine"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t space-y-4 border-line">
        {isLoadingSubmission ? (
          <div className="flex justify-center py-6" aria-busy="true">
            <Loader fullScreen={false} label="Loading your submission..." />
          </div>
        ) : (
          <>
            {submission && <AssignmentSubmissionStatus submission={submission} />}
            <AssignmentSubmissionForm
              assignment={assignment}
              hasSubmission={Boolean(submission)}
              canSubmit={canSubmit}
              isPastDue={isPastDue}
            />
          </>
        )}
      </div>
    </div>
  );
}
