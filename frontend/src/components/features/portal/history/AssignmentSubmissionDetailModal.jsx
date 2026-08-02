"use client";

import { ClipboardList } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/adminFormatters";
import AssignmentSubmissionStatus from "../course-detail/AssignmentSubmissionStatus";

export default function AssignmentSubmissionDetailModal({ assignment, onClose }) {
  const isOpen = Boolean(assignment);
  const submission = assignment?.submission;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={ClipboardList}
      title={assignment?.title}
      subtitle={
        assignment
          ? `${assignment.course?.title || ""}${
              assignment.module ? ` · ${assignment.module.title}` : ""
            }`
          : ""
      }
      maxWidth="max-w-xl"
    >
      {assignment && submission && (
        <div className="space-y-4">
          <p className="text-xs text-stone-500 font-light">
            Due {formatDateTime(assignment.due_date)} · {assignment.total_marks} marks
          </p>
          <AssignmentSubmissionStatus
            submission={{
              ...submission,
              assignment: { total_marks: assignment.total_marks },
            }}
          />
        </div>
      )}
    </Modal>
  );
}
