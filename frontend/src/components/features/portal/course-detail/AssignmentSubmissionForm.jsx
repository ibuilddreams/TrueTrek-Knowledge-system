"use client";

import { useState } from "react";
import { Loader2, Paperclip, UploadCloud, X } from "lucide-react";
import { useSubmitAssignment } from "@/hooks/student/useAssignmentSubmission";
import {
  ALL_ALLOWED_ASSIGNMENT_EXTENSIONS,
  ASSIGNMENT_FILE_ACCEPT,
  MAX_ASSIGNMENT_FILE_SIZE_MB,
  isAllowedAssignmentFile,
} from "@/lib/assignmentFileTypes";
import { toastError } from "@/lib/toast";
import { PortalButton, PortalSectionLabel } from "../shell/PortalUI";

export default function AssignmentSubmissionForm({
  assignment,
  hasSubmission,
  canSubmit,
  isPastDue,
}) {
  const [files, setFiles] = useState([]);
  const submitMutation = useSubmitAssignment(assignment.id);
  const isAiGraded = assignment.grading_mode === "AI";

  if (!canSubmit) {
    return (
      <div className="rounded-xl border border-dashed border-cn-p-line-2 bg-cn-p-page px-4 py-4 text-sm text-cn-p-ink-2">
        {isPastDue
          ? "The due date has passed and resubmission isn't allowed for this assignment."
          : "Submissions are disabled — your enrollment for this course isn't active."}
      </div>
    );
  }

  function handleFileChange(event) {
    const selected = Array.from(event.target.files || []);
    const validFiles = [];
    selected.forEach((file) => {
      const { valid, reason } = isAllowedAssignmentFile(file);
      if (!valid) {
        toastError(reason);
        return;
      }
      validFiles.push(file);
    });
    setFiles((prev) => [...prev, ...validFiles]);
    event.target.value = "";
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (files.length === 0) {
      toastError("Attach at least one file.");
      return;
    }
    submitMutation.mutate(
      { files },
      {
        onSuccess: () => {
          setFiles([]);
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <PortalSectionLabel className="px-0 pt-0">
        {hasSubmission ? "Resubmit your work" : "Submit your work"}
      </PortalSectionLabel>

      <div className="space-y-2">
        <label
          className="inline-flex cursor-pointer items-center gap-2 rounded-cn-p-sm border border-dashed border-cn-p-line-2 px-3.5 py-2.5 text-sm font-semibold text-cn-p-ink-2 transition-colors duration-150 hover:border-cn-p-accent hover:bg-cn-p-soft hover:text-cn-p-soft-ink"
        >
          <UploadCloud className="h-4 w-4" />
          Attach files
          <input
            type="file"
            multiple
            accept={ASSIGNMENT_FILE_ACCEPT}
            onChange={handleFileChange}
            disabled={submitMutation.isPending}
            className="hidden"
          />
        </label>
        <p className="text-xs text-cn-p-muted">
          Allowed: {ALL_ALLOWED_ASSIGNMENT_EXTENSIONS.join(", ")} · up to {MAX_ASSIGNMENT_FILE_SIZE_MB}
          MB each
        </p>

        {files.length > 0 && (
          <ul className="space-y-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 rounded-cn-p-sm border border-cn-p-line bg-cn-p-page px-3 py-1.5 text-[13px] text-cn-p-ink-2"
              >
                <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                  <Paperclip className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={submitMutation.isPending}
                  className="text-cn-p-ink-2 transition-colors duration-150 hover:text-cn-p-bad"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PortalButton
        as="button"
        type="submit"
        disabled={submitMutation.isPending || files.length === 0}
        className="self-start"
      >
        {submitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitMutation.isPending && isAiGraded
          ? "Elite Coach is reviewing your submission…"
          : hasSubmission
            ? "Resubmit assignment"
            : "Submit assignment"}
      </PortalButton>
      {submitMutation.isPending && isAiGraded ? (
        <p className="text-xs text-cn-p-muted">
          Your work has been saved. This can take up to a minute — please don&apos;t close this window.
        </p>
      ) : null}
    </form>
  );
}
