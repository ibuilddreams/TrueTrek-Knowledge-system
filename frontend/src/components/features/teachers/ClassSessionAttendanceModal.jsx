"use client";

import { ClipboardList } from "lucide-react";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import { useClassSessionAttendance } from "@/hooks/useTeacherClassSessions";
import {
  formatClassDate,
  formatClassTime,
} from "@/components/features/classroom/classSessionUtils";
import { getApiErrorMessage } from "@/lib/apiErrors";

/**
 * Who opened the classroom, and when.
 *
 * Headed "arrived", not "attended": the server only hears from a participant
 * when it issues their join token, so a row proves someone came through the
 * door — not that they stayed for the hour (see
 * class_sessions/models.py::ClassSessionAttendance).
 */
export default function ClassSessionAttendanceModal({ isOpen, onClose, session }) {
  const {
    data: attendance = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useClassSessionAttendance(session?.id, { enabled: isOpen });

  const columns = [
    {
      key: "student_name",
      header: "Name",
      render: (row) => (
        <span className="flex flex-col">
          <span className="font-medium text-ink">{row.student_name}</span>
          <span className="text-[11px] text-muted font-light">{row.student_email}</span>
        </span>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">
          {row.role === "HOST" ? "Instructor" : "Student"}
        </span>
      ),
    },
    {
      key: "first_joined_at",
      header: "Arrived",
      render: (row) =>
        `${formatClassDate(row.first_joined_at)} · ${formatClassTime(row.first_joined_at)}`,
    },
    {
      key: "left_at",
      header: "Left",
      render: (row) =>
        row.left_at ? formatClassTime(row.left_at) : <span className="text-muted">—</span>,
    },
    {
      key: "join_count",
      header: "Joins",
      render: (row) => row.join_count,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={ClipboardList}
      title="Attendance"
      subtitle={session?.title}
      maxWidth="max-w-3xl"
    >
      <DataTable
        columns={columns}
        rows={attendance}
        isLoading={isLoading}
        error={isError ? getApiErrorMessage(error, "Unable to load attendance.") : null}
        onRetry={refetch}
        emptyLabel="Nobody has opened this classroom yet."
        size="lg"
      />

      <p className="mt-4 pt-4 border-t border-line text-[11px] text-muted font-light leading-relaxed">
        &ldquo;Arrived&rdquo; is when someone opened the classroom. A browser that
        closes without warning never reports leaving, so treat &ldquo;Left&rdquo; as
        a best effort rather than a register of minutes attended.
      </p>
    </Modal>
  );
}
