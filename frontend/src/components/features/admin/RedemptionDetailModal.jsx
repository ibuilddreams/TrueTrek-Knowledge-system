"use client";

import { Calendar, Clock, ExternalLink, User } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime, formatPlainDate, formatPlainTime } from "@/lib/adminFormatters";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-stone-50 last:border-0">
      <span className="text-stone-500 font-light">{label}</span>
      <span className="text-stone-800 font-medium text-right">{value}</span>
    </div>
  );
}

export default function RedemptionDetailModal({ isOpen, onClose, redemption }) {
  if (!redemption) return null;

  const fulfillment = redemption.fulfillment;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Redemption Details" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-serif font-bold text-lg text-stone-900">{redemption.student?.name}</p>
            <p className="text-xs text-stone-400">{redemption.student?.email}</p>
          </div>
          <StatusBadge size="lg" status={redemption.status} />
        </div>

        <div className="bg-stone-50 border border-stone-100 rounded-xl p-4">
          <InfoRow label="Reward" value={redemption.reward?.name} />
          <InfoRow label="Reward Type" value={redemption.reward?.reward_type} />
          {redemption.reward?.duration_minutes && (
            <InfoRow label="Duration" value={`${redemption.reward.duration_minutes} minutes`} />
          )}
          <InfoRow label="Points" value={redemption.points_cost?.toLocaleString()} />
          <InfoRow label="Requested" value={formatDateTime(redemption.created_at)} />
          {redemption.approved_at && (
            <InfoRow label="Approved" value={`${formatDateTime(redemption.approved_at)} by ${redemption.approved_by?.name || "—"}`} />
          )}
          {redemption.cancelled_at && (
            <InfoRow label="Cancelled" value={`${formatDateTime(redemption.cancelled_at)} by ${redemption.cancelled_by?.name || "—"}`} />
          )}
        </div>

        {redemption.student_note && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-amber-700/80 font-semibold mb-1">
              Student message
            </p>
            <p className="text-sm text-amber-900">{redemption.student_note}</p>
          </div>
        )}

        {fulfillment && (fulfillment.scheduled_date || fulfillment.notes) && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-1.5">
            <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-700/80 font-semibold mb-1">
              Fulfillment
            </p>
            {fulfillment.scheduled_date && (
              <div className="flex items-center gap-2 text-sm text-emerald-900">
                <Calendar className="w-4 h-4" />
                {formatPlainDate(fulfillment.scheduled_date)}
              </div>
            )}
            {fulfillment.start_time && (
              <div className="flex items-center gap-2 text-sm text-emerald-900">
                <Clock className="w-4 h-4" />
                {formatPlainTime(fulfillment.start_time)}
                {fulfillment.end_time ? ` – ${formatPlainTime(fulfillment.end_time)}` : ""}
              </div>
            )}
            {fulfillment.mentor && (
              <div className="flex items-center gap-2 text-sm text-emerald-900">
                <User className="w-4 h-4" />
                {fulfillment.mentor.name}
              </div>
            )}
            {fulfillment.meeting_url && (
              <a
                href={fulfillment.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-800 underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {fulfillment.meeting_url}
              </a>
            )}
            {fulfillment.notes && <p className="text-sm text-emerald-800 font-mono mt-1">{fulfillment.notes}</p>}
          </div>
        )}

        {redemption.cancellation_reason && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
            <p className="text-[11px] font-mono uppercase tracking-wider text-rose-700/80 font-semibold mb-1">
              Cancellation reason
            </p>
            <p className="text-sm text-rose-900">{redemption.cancellation_reason}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
