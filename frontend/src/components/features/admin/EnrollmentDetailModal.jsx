"use client";

import { ClipboardList } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/adminFormatters";

export default function EnrollmentDetailModal({ isOpen, onClose, enrollment }) {
  if (!enrollment) return null;

  return (
    <Modal variant="cobalt" isOpen={isOpen} onClose={onClose} icon={ClipboardList} title="Enrollment details" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-bold text-cn-p-ink">{enrollment.student?.name}</h4>
          <StatusBadge tone="cobalt" size="lg" status={enrollment.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] text-cn-p-ink-2 mb-1">Student Email</p>
            <p className="text-cn-p-ink-2 font-semibold break-all">{enrollment.student?.email}</p>
          </div>
          <div>
            <p className="text-[11px] text-cn-p-ink-2 mb-1">Course</p>
            <p className="text-cn-p-ink-2 font-semibold">{enrollment.course?.title}</p>
          </div>
          <div>
            <p className="text-[11px] text-cn-p-ink-2 mb-1">Course Status</p>
            <StatusBadge tone="cobalt" size="lg" status={enrollment.course?.status} />
          </div>
          <div>
            <p className="text-[11px] text-cn-p-ink-2 mb-1">Teacher</p>
            <p className="text-cn-p-ink-2 font-semibold">{enrollment.teacher?.name || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-[11px] text-cn-p-ink-2 mb-1">Enrolled At</p>
            <p className="text-cn-p-ink-2 font-semibold">{formatDateTime(enrollment.enrolled_at)}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
