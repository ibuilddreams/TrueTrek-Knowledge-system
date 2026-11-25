"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, ClipboardList, Download, Paperclip } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import { getAssignmentAttachments } from "@/services/assignmentsService";
import { formatDateTime } from "@/lib/adminFormatters";
import { useMyAssignmentSubmission } from "@/hooks/student/useAssignmentSubmission";
import AssignmentSubmissionForm from "./AssignmentSubmissionForm";
import AssignmentSubmissionStatus from "./AssignmentSubmissionStatus";

export default function AssignmentDetailModal({
  assignment,
  canInteract,
  onClose,
}) {
  const isOpen = Boolean(assignment);
  const assignmentId = assignment?.id;

  const { data: attachments = [] } = useQuery({
    queryKey: ["assignmentAttachments", assignmentId],
    queryFn: async () => {
      const response = await getAssignmentAttachments(assignmentId);
      return response?.data || [];
    },
    enabled: isOpen && Boolean(assignmentId),
  });

  const { data: submission, isLoading: isLoadingSubmission } =
    useMyAssignmentSubmission(assignmentId, { enabled: isOpen });

  const isPastDue = assignment
    ? new Date(assignment.due_date) < new Date()
    : false;
  const canSubmit =
    canInteract &&
    (!isPastDue || !submission || Boolean(assignment?.allow_resubmission));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={ClipboardList}
      title={assignment?.title}
      subtitle={
        assignment
          ? `Due ${formatDateTime(assignment.due_date)} · ${assignment.total_marks} marks`
          : ""
      }
      variant="cobalt"
      maxWidth="max-w-2xl"
    >
      {assignment && (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-cn-base leading-relaxed whitespace-pre-line text-cn-ink-2">
              {assignment.description ||
                "No instructions have been added for this assignment."}
            </p>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${
                  isPastDue
                    ? "bg-cn-p-bad-bg text-cn-p-bad"
                    : "bg-cn-p-neutral-bg text-cn-p-ink-2"
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                Due {formatDateTime(assignment.due_date)}
              </span>
              {assignment.allow_resubmission ? (
                <span className="inline-flex h-6 items-center rounded-full bg-cn-p-soft px-2.5 text-xs font-semibold whitespace-nowrap text-cn-p-soft-ink">
                  Resubmission allowed
                </span>
              ) : null}
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-bold text-cn-p-ink">
                Reference materials
              </h5>
              <div className="space-y-1.5">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between gap-2 rounded-cn-p-sm border border-cn-p-line bg-cn-p-page px-3 py-2.5 text-[13px] text-cn-p-ink-2"
                  >
                    <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                      <Paperclip className="h-4 w-4 shrink-0 text-cn-p-muted" />
                      <span className="truncate">
                        {attachment.original_name || attachment.file}
                      </span>
                    </span>
                    <a
                      href={attachment.file}
                      download={attachment.original_name || true}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-2.5 py-1 text-xs font-semibold text-cn-p-ink-2 no-underline transition-colors duration-150 hover:border-cn-p-ink hover:text-cn-p-ink"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 border-t border-cn-p-line pt-5">
            {isLoadingSubmission ? (
              <div className="flex justify-center py-6" aria-busy="true">
                <Loader fullScreen={false} tone="portal" label="Loading your submission..." />
              </div>
            ) : (
              <>
                {submission && (
                  <AssignmentSubmissionStatus submission={submission} />
                )}
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
      )}
    </Modal>
  );
}
