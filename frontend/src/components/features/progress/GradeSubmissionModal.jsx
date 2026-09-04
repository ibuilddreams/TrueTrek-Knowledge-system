"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ClipboardCheck,
  Download,
  FileText,
  Image as ImageIcon,
  Presentation,
  Sparkles,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { gradeAssignmentSubmission } from "@/services/assignmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FILE_TYPE_ICONS = {
  DOCUMENT: FileText,
  PRESENTATION: Presentation,
  ARCHIVE: Archive,
  IMAGE: ImageIcon,
};

function getFileName(file) {
  if (file.original_name) return file.original_name;
  const path = file.file?.split("?")[0] || "";
  const basename = path.split("/").pop();
  try {
    return basename ? decodeURIComponent(basename) : "Attachment";
  } catch {
    return basename || "Attachment";
  }
}

function getFileExtension(name) {
  const dotIndex = name.lastIndexOf(".");
  return dotIndex > -1 ? name.slice(dotIndex + 1).toUpperCase() : "";
}

export default function GradeSubmissionModal({ row, onClose, courseId }) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!row) return;
    setMarks(row.marks ?? "");
    setFeedback(row.feedback ?? "");
    // Reset only when a different submission is opened, not on every row re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row?.rowId]);

  const gradeMutation = useMutation({
    mutationFn: () =>
      gradeAssignmentSubmission(row.submission_id, { marks: Number(marks), feedback }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["assignment-course-progress", courseId] });
      toastSuccess(response?.message || "Submission graded successfully.");
      onClose();
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to grade submission."));
    },
  });

  return (
    <Modal
      isOpen={Boolean(row)}
      onClose={onClose}
      icon={ClipboardCheck}
      title="Grade Submission"
      subtitle={row ? `${row.student.name} · ${row.assignment.title}` : ""}
    >
      {row && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            gradeMutation.mutate();
          }}
          className="space-y-4"
        >
          {row.files?.length > 0 && (
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-stone-450 font-semibold mb-1.5 block">
                Attachments
              </label>
              <ul className="space-y-2">
                {row.files.map((file) => {
                  const name = getFileName(file);
                  const extension = getFileExtension(name);
                  const Icon = FILE_TYPE_ICONS[file.file_type] || FileText;
                  return (
                    <li key={file.id}>
                      <a
                        href={file.file}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/60 transition group"
                      >
                        <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-amber-600/10 text-amber-700">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-mono font-semibold text-stone-800 truncate">
                            {name}
                          </span>
                          {extension && (
                            <span className="block text-[11px] font-mono text-stone-400 mt-0.5">
                              {extension} file
                            </span>
                          )}
                        </span>
                        <Download className="w-4 h-4 text-stone-400 group-hover:text-amber-700 transition shrink-0" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {row.assignment.grading_mode === "AI" && row.ai_review && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 space-y-1.5">
              <p className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-700 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                AI Grading — {row.ai_review.status}
                {row.ai_review.score !== null && row.ai_review.score !== undefined
                  ? ` (${Math.round(Number(row.ai_review.score))}%)`
                  : ""}
              </p>
              {row.ai_review.feedback && (
                <p className="text-sm text-stone-700">{row.ai_review.feedback}</p>
              )}
              <p className="text-[11px] font-mono text-stone-400">
                This is a read-only AI evaluation. You can still override the marks/feedback below.
              </p>
            </div>
          )}

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-stone-450 font-semibold mb-1.5 block">
              Marks (out of {row.assignment.total_marks})
            </label>
            <input
              type="number"
              min={0}
              max={row.assignment.total_marks}
              value={marks}
              onChange={(event) => setMarks(event.target.value)}
              required
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 transition"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-stone-450 font-semibold mb-1.5 block">
              Feedback
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 transition resize-none"
              placeholder="Optional feedback for the student..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-mono font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={gradeMutation.isPending}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-mono font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              {gradeMutation.isPending ? "Saving..." : "Save Grade"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
