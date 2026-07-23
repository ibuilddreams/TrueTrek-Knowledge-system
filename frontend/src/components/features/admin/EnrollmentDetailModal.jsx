"use client";

import { ClipboardList } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/adminFormatters";

export default function EnrollmentDetailModal({ isOpen, onClose, enrollment }) {
  if (!enrollment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={ClipboardList} title="Enrollment Details" maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-base font-serif font-bold text-stone-900">{enrollment.student?.name}</h4>
          <StatusBadge status={enrollment.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-1">Student Email</p>
            <p className="text-stone-700 font-semibold break-all">{enrollment.student?.email}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-1">Course</p>
            <p className="text-stone-700 font-semibold">{enrollment.course?.title}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-1">Course Status</p>
            <StatusBadge status={enrollment.course?.status} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mb-1">Enrolled At</p>
            <p className="text-stone-700 font-semibold">{formatDateTime(enrollment.enrolled_at)}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
