"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, ClipboardList, Paperclip } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import { getAssignmentAttachments } from "@/services/assignmentsService";
import { formatDateTime } from "@/lib/adminFormatters";
import { useMyAssignmentSubmission } from "@/hooks/student/useAssignmentSubmission";
import AssignmentSubmissionForm from "./AssignmentSubmissionForm";
import AssignmentSubmissionStatus from "./AssignmentSubmissionStatus";

export default function AssignmentDetailModal({ assignment, canInteract, onClose }) {
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

  const { data: submission, isLoading: isLoadingSubmission } = useMyAssignmentSubmission(
    assignmentId,
    { enabled: isOpen }
  );

  const isPastDue = assignment ? new Date(assignment.due_date) < new Date() : false;
  const canSubmit = canInteract && (!isPastDue || !submission || Boolean(assignment?.allow_resubmission));

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
      maxWidth="max-w-2xl"
    >
      {assignment && (
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm text-stone-600 font-light leading-relaxed whitespace-pre-line">
              {assignment.description || "No instructions have been added for this assignment."}
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                  isPastDue
                    ? "bg-rose-50 text-rose-600 border-rose-100"
                    : "bg-stone-50 text-stone-500 border-stone-200"
                }`}
              >
                <Calendar className="w-3 h-3" />
                Due {formatDateTime(assignment.due_date)}
              </span>
              {assignment.allow_resubmission ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg border bg-amber-50 text-amber-700 border-amber-100">
                  Resubmission allowed
                </span>
              ) : null}
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-mono uppercase tracking-wider text-stone-400">
                Reference materials
              </h5>
              <div className="space-y-1.5">
                {attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[12px] text-stone-600 hover:text-amber-800 transition"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{attachment.original_name || attachment.file}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-stone-100 space-y-4">
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
      )}
    </Modal>
  );
}
