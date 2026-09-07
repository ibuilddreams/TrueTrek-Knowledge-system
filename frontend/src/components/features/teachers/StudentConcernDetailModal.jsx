"use client";

import { CheckCircle2, Clock3, Loader2, ShieldAlert } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/adminFormatters";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-stone-500 font-light">{label}</span>
      <span className="text-stone-800 font-medium text-right">{value}</span>
    </div>
  );
}

export default function StudentConcernDetailModal({ isOpen, onClose, concern }) {
  if (!concern) return null;

  const status = concern.status;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={ShieldAlert}
      title={`Concern about ${concern.student?.name || "a student"}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
            {concern.category_display}
          </span>
          <StatusBadge size="lg" status={status} />
        </div>

        {concern.requires_admin_attention && (
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            Flagged for admin attention
          </div>
        )}

        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-semibold mb-1.5">
            Your Description
          </p>
          <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
            {concern.description}
          </p>
        </div>

        {status === "PENDING" && (
          <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <Clock3 className="w-4 h-4 shrink-0" />
            This concern is waiting for the admin team to take a look.
          </div>
        )}

        {status === "IN_PROGRESS" && (
          <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <Loader2 className="w-4 h-4 shrink-0" />
            The admin team is currently reviewing this concern.
          </div>
        )}

        {status === "RESOLVED" && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Resolved
            </div>
            {concern.resolution_notes && (
              <p className="text-sm text-emerald-700 whitespace-pre-wrap leading-relaxed">
                {concern.resolution_notes}
              </p>
            )}
          </div>
        )}

        <div className="border-t border-stone-100 pt-3">
          {concern.course?.title && <InfoRow label="Course" value={concern.course.title} />}
          <InfoRow label="Flagged" value={formatDateTime(concern.created_at)} />
          <InfoRow label="Last Updated" value={formatDateTime(concern.updated_at)} />
          {concern.resolved_at && (
            <InfoRow label="Resolved" value={formatDateTime(concern.resolved_at)} />
          )}
        </div>
      </div>
    </Modal>
  );
}
