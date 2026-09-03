"use client";

import { CheckCircle2, Clock3, FileWarning, Loader2 } from "lucide-react";
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

export default function RequestDetailModal({ isOpen, onClose, request }) {
  if (!request) return null;

  const status = request.status;

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={FileWarning} title={request.title} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-stone-500 font-semibold">
            {request.request_type_display}
          </span>
          <StatusBadge size="lg" status={status} />
        </div>

        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-semibold mb-1.5">
            Your Description
          </p>
          <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{request.description}</p>
        </div>

        {status === "PENDING" && (
          <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <Clock3 className="w-4 h-4 shrink-0" />
            Your request is waiting for the admin team to take a look.
          </div>
        )}

        {status === "IN_PROGRESS" && (
          <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-4">
            <Loader2 className="w-4 h-4 shrink-0" />
            The admin team is currently working on this request.
          </div>
        )}

        {status === "COMPLETED" && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Resolved
            </div>
            {request.resolution_description && (
              <p className="text-sm text-emerald-700 whitespace-pre-wrap leading-relaxed">
                {request.resolution_description}
              </p>
            )}
          </div>
        )}

        <div className="border-t border-stone-100 pt-3">
          <InfoRow label="Submitted" value={formatDateTime(request.created_at)} />
          <InfoRow label="Last Updated" value={formatDateTime(request.updated_at)} />
          {request.completed_at && (
            <InfoRow label="Completed" value={formatDateTime(request.completed_at)} />
          )}
        </div>
      </div>
    </Modal>
  );
}
