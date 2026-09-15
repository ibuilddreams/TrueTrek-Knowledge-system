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
      <div
        className="rounded-xl border border-dashed px-4 py-4 text-sm border-line bg-porcelain text-muted"
      >
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <h5
        className="text-sm font-mono uppercase tracking-wider text-muted"
      >
        {hasSubmission ? "Resubmit your work" : "Submit your work"}
      </h5>

      <div className="space-y-2">
        <label
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-dashed rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer transition border-line hover:border-pine text-muted hover:text-pine"
        >
          <UploadCloud className="w-3.5 h-3.5" />
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
        <p className="text-[11px] text-muted">
          Allowed: {ALL_ALLOWED_ASSIGNMENT_EXTENSIONS.join(", ")} · up to {MAX_ASSIGNMENT_FILE_SIZE_MB}
          MB each
        </p>

        {files.length > 0 && (
          <ul className="space-y-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 text-[12px] border rounded-lg px-3 py-1.5 text-muted bg-porcelain border-line"
              >
                <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                  <Paperclip
                    className="w-3.5 h-3.5 shrink-0 text-muted"
                  />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={submitMutation.isPending}
                  className="transition text-muted hover:text-rose-600"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={submitMutation.isPending || files.length === 0}
        className="inline-flex items-center gap-2 px-4 py-2.5 disabled:opacity-50 text-xs font-mono uppercase tracking-wider rounded-xl transition bg-pine hover:bg-moss text-paper"
      >
        {submitMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {submitMutation.isPending && isAiGraded
          ? "Elite Coach is reviewing your submission…"
          : hasSubmission
            ? "Resubmit assignment"
            : "Submit assignment"}
      </button>
      {submitMutation.isPending && isAiGraded ? (
        <p className="text-[11px] text-muted">
          Your work has been saved. This can take up to a minute — please don&apos;t close this window.
        </p>
      ) : null}
    </form>
  );
}
