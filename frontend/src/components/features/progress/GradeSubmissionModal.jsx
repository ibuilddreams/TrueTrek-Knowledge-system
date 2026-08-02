"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Download, Paperclip } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { gradeAssignmentSubmission } from "@/services/assignmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

export default function GradeSubmissionModal({ row, onClose, courseId }) {
  const queryClient = useQueryClient();
  const [marks, setMarks] = useState(row?.marks ?? "");
  const [feedback, setFeedback] = useState(row?.feedback ?? "");

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
              <label className="text-[10px] font-mono uppercase tracking-wider text-stone-450 font-semibold mb-1.5 block">
                Attachments
              </label>
              <ul className="space-y-1.5">
                {row.files.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-700 hover:text-amber-900 transition"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      {file.original_name}
                      <Download className="w-3 h-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-stone-450 font-semibold mb-1.5 block">
              Marks (out of {row.assignment.total_marks})
            </label>
            <input
              type="number"
              min={0}
              max={row.assignment.total_marks}
              value={marks}
              onChange={(event) => setMarks(event.target.value)}
              required
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 transition"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-stone-450 font-semibold mb-1.5 block">
              Feedback
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 transition resize-none"
              placeholder="Optional feedback for the student..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-mono font-semibold uppercase tracking-wider text-stone-500 hover:text-stone-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={gradeMutation.isPending}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-mono font-semibold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              {gradeMutation.isPending ? "Saving..." : "Save Grade"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
