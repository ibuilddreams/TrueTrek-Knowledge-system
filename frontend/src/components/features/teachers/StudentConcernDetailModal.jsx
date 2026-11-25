"use client";

import { CheckCircle2, Clock3, Loader2, ShieldAlert } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/adminFormatters";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-cn-p-ink-2 font-light">{label}</span>
      <span className="text-cn-p-ink font-medium text-right">{value}</span>
    </div>
  );
}

export default function StudentConcernDetailModal({ isOpen, onClose, concern }) {
  if (!concern) return null;

  const status = concern.status;

  return (
    <Modal variant="cobalt"
      isOpen={isOpen}
      onClose={onClose}
      icon={ShieldAlert}
      title={`Concern about ${concern.student?.name || "a student"}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-cn-p-ink-2 font-semibold">
            {concern.category_display}
          </span>
          <StatusBadge tone="cobalt" size="lg" status={status} />
        </div>

        {concern.requires_admin_attention && (
          <div className="flex items-center gap-2 text-xs text-cn-p-bad bg-cn-p-bad-bg border border-cn-p-bad-bg rounded-lg px-3 py-2">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            Flagged for admin attention
          </div>
        )}

        <div>
          <p className="text-[11px] text-cn-p-ink-2 font-semibold mb-1.5">
            Your description
          </p>
          <p className="text-sm text-cn-p-ink-2 whitespace-pre-wrap leading-relaxed">
            {concern.description}
          </p>
        </div>

        {status === "PENDING" && (
          <div className="flex items-center gap-2 text-sm text-cn-p-soft-ink bg-cn-p-soft border border-cn-p-soft rounded-xl p-4">
            <Clock3 className="w-4 h-4 shrink-0" />
            This concern is waiting for the admin team to take a look.
          </div>
        )}

        {status === "IN_PROGRESS" && (
          <div className="flex items-center gap-2 text-sm text-cn-p-soft-ink bg-cn-p-soft border border-cn-p-soft rounded-xl p-4">
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

        <div className="border-t border-cn-p-line pt-3">
          {concern.course?.title && <InfoRow label="Course" value={concern.course.title} />}
          <InfoRow label="Flagged" value={formatDateTime(concern.created_at)} />
          <InfoRow label="Last updated" value={formatDateTime(concern.updated_at)} />
          {concern.resolved_at && (
            <InfoRow label="Resolved" value={formatDateTime(concern.resolved_at)} />
          )}
        </div>
      </div>
    </Modal>
  );
}
