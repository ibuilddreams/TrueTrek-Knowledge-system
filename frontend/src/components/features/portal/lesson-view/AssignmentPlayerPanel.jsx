"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Paperclip } from "lucide-react";
import Loader from "@/components/ui/Loader";
import { getAssignmentAttachments } from "@/services/assignmentsService";
import { getPortalAssignmentStatus } from "@/lib/curriculumMeta";
import { useMyAssignmentSubmission } from "@/hooks/student/useAssignmentSubmission";
import {
  PortalKv,
  PortalKvItem,
  PortalPill,
  PortalSectionLabel,
} from "../shell/PortalUI";
import AssignmentSubmissionForm from "../course-detail/AssignmentSubmissionForm";
import AssignmentSubmissionStatus from "../course-detail/AssignmentSubmissionStatus";

function formatDue(value) {
  if (!value) return "No due date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AssignmentPlayerPanel({
  assignment,
  moduleIndex,
  moduleCount,
  canInteract,
}) {
  const assignmentId = assignment.id;

  const { data: attachments = [] } = useQuery({
    queryKey: ["assignmentAttachments", assignmentId],
    queryFn: async () => {
      const response = await getAssignmentAttachments(assignmentId);
      return response?.data || [];
    },
    enabled: Boolean(assignmentId),
  });

  const { data: submission, isLoading: isLoadingSubmission } =
    useMyAssignmentSubmission(assignmentId);

  const isPastDue = assignment.due_date
    ? new Date(assignment.due_date) < new Date()
    : false;
  const canSubmit =
    canInteract && (!isPastDue || !submission || Boolean(assignment.allow_resubmission));
  const status = getPortalAssignmentStatus({ ...assignment, submission });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <PortalPill tone="blue">Assignment</PortalPill>
        <PortalPill tone={status.tone}>{status.label}</PortalPill>
      </div>

      <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.015em] text-cn-p-ink">
        {assignment.title}
      </h2>

      <PortalKv>
        <PortalKvItem label="Due" value={formatDue(assignment.due_date)} />
        <PortalKvItem label="Marks" value={assignment.total_marks ?? "—"} />
        <PortalKvItem
          label="Module"
          value={
            Number.isInteger(moduleIndex) && moduleIndex >= 0 && moduleCount
              ? `${moduleIndex + 1} of ${moduleCount}`
              : "Course-wide"
          }
        />
        <PortalKvItem
          label="Resubmission"
          value={assignment.allow_resubmission ? "Allowed" : "Not allowed"}
        />
      </PortalKv>

      <div>
        <PortalSectionLabel className="px-0">What to submit</PortalSectionLabel>
        <p className="text-base leading-[1.7] whitespace-pre-line text-[#1F2937]">
          {assignment.description || "No instructions have been added for this assignment."}
        </p>
      </div>

      {attachments.length > 0 && (
        <div>
          <PortalSectionLabel className="px-0">Reference materials</PortalSectionLabel>
          <div className="mt-1 flex flex-col gap-1.5">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-cn-p-line bg-cn-p-page px-3 py-2.5 text-[13px] text-cn-p-ink-2"
              >
                <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                  <Paperclip aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
                  <span className="truncate">{attachment.original_name || attachment.file}</span>
                </span>
                <a
                  href={attachment.file}
                  download={attachment.original_name || true}
                  className="inline-flex shrink-0 items-center gap-1 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-2.5 py-1 text-xs font-semibold text-cn-p-ink transition-colors duration-150 hover:border-cn-p-ink"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-cn-p-line pt-5">
        {isLoadingSubmission ? (
          <div className="flex justify-center py-6" aria-busy="true">
            <Loader fullScreen={false} tone="portal" label="Loading your submission..." />
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
