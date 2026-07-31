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
  const [submissionText, setSubmissionText] = useState("");
  const [files, setFiles] = useState([]);
  const submitMutation = useSubmitAssignment(assignment.id);

  if (!canSubmit) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-4 text-xs text-stone-500">
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
    if (!submissionText.trim() && files.length === 0) {
      toastError("Provide submission text or at least one file.");
      return;
    }
    submitMutation.mutate(
      { submissionText, files },
      {
        onSuccess: () => {
          setSubmissionText("");
          setFiles([]);
        },
      }
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h5 className="text-xs font-mono uppercase tracking-wider text-stone-400">
        {hasSubmission ? "Resubmit your work" : "Submit your work"}
      </h5>
      <textarea
        value={submissionText}
        onChange={(event) => setSubmissionText(event.target.value)}
        rows={4}
        placeholder="Write your submission notes here..."
        disabled={submitMutation.isPending}
        className="w-full px-3.5 py-3 bg-stone-50/90 border border-stone-200 focus:border-amber-500/70 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:outline-none rounded-xl text-sm text-stone-800 placeholder:text-stone-400 transition"
      />

      <div className="space-y-2">
        <label className="inline-flex items-center gap-2 px-3.5 py-2 border border-dashed border-stone-300 hover:border-amber-400 rounded-xl text-[11px] font-mono uppercase tracking-wider text-stone-500 hover:text-amber-700 cursor-pointer transition">
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
        <p className="text-[10px] text-stone-400">
          Allowed: {ALL_ALLOWED_ASSIGNMENT_EXTENSIONS.join(", ")} · up to {MAX_ASSIGNMENT_FILE_SIZE_MB}
          MB each
        </p>

        {files.length > 0 && (
          <ul className="space-y-1.5">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-2 text-[12px] text-stone-600 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5"
              >
                <span className="inline-flex items-center gap-1.5 min-w-0 truncate">
                  <Paperclip className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={submitMutation.isPending}
                  className="text-stone-400 hover:text-rose-600 transition"
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
        disabled={submitMutation.isPending}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
      >
        {submitMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {hasSubmission ? "Resubmit assignment" : "Submit assignment"}
      </button>
    </form>
  );
}
