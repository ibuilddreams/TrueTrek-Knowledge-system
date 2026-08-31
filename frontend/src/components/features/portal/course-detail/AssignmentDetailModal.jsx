"use client";

import { useQuery } from "@tanstack/react-query";
import { Calendar, ClipboardList, Download, Paperclip } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import { getAssignmentAttachments } from "@/services/assignmentsService";
import { formatDateTime } from "@/lib/adminFormatters";
import { useMyAssignmentSubmission } from "@/hooks/student/useAssignmentSubmission";
import { useTheme } from "@/hooks/useTheme";
import AssignmentSubmissionForm from "./AssignmentSubmissionForm";
import AssignmentSubmissionStatus from "./AssignmentSubmissionStatus";

export default function AssignmentDetailModal({
  assignment,
  canInteract,
  onClose,
}) {
  const { isVault } = useTheme();
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
      maxWidth="max-w-2xl"
    >
      {assignment && (
        <div className="space-y-6">
          <div className="space-y-3">
            <p
              className={`text-sm font-light leading-relaxed whitespace-pre-line ${
                isVault ? "text-stone-300" : "text-stone-600"
              }`}
            >
              {assignment.description ||
                "No instructions have been added for this assignment."}
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono uppercase tracking-wider">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border ${
                  isPastDue
                    ? isVault
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-rose-50 text-rose-600 border-rose-100"
                    : isVault
                      ? "bg-white/5 text-stone-400 border-stone-700"
                      : "bg-stone-50 text-stone-500 border-stone-200"
                }`}
              >
                <Calendar className="w-3 h-3" />
                Due {formatDateTime(assignment.due_date)}
              </span>
              {assignment.allow_resubmission ? (
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-lg border ${
                    isVault
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  }`}
                >
                  Resubmission allowed
                </span>
              ) : null}
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2">
              <h5
                className={`text-sm font-mono uppercase tracking-wider ${
                  isVault ? "text-stone-500" : "text-stone-400"
                }`}
              >
                Reference materials
              </h5>
              <div className="space-y-1.5">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className={`flex items-center justify-between gap-2 text-[12px] border rounded-lg px-3 py-2 ${
                      isVault
                        ? "text-stone-300 bg-white/5 border-stone-800"
                        : "text-stone-600 bg-stone-50 border-stone-200"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                      <Paperclip
                        className={`w-3.5 h-3.5 shrink-0 ${isVault ? "text-stone-500" : "text-stone-400"}`}
                      />
                      <span className="truncate">
                        {attachment.original_name || attachment.file}
                      </span>
                    </span>
                    <a
                      href={attachment.file}
                      download={attachment.original_name || true}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 border text-[11px] font-mono uppercase tracking-wider rounded-md transition shrink-0 ${
                        isVault
                          ? "border-stone-700 hover:border-amber-500/50 hover:bg-white/10 text-stone-400 hover:text-amber-400"
                          : "border-stone-200 hover:border-amber-300 hover:bg-white text-stone-500 hover:text-amber-800"
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className={`pt-4 border-t space-y-4 ${isVault ? "border-stone-800" : "border-stone-100"}`}
          >
            {isLoadingSubmission ? (
              <div className="flex justify-center py-6" aria-busy="true">
                <Loader fullScreen={false} label="Loading your submission..." />
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
