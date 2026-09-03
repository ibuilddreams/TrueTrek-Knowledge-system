"use client";

import { Calendar, CheckCircle2, Clock, ExternalLink, Gift, User, XCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDateTime, formatPlainDate, formatPlainTime } from "@/lib/adminFormatters";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span className="text-stone-500 font-light">{label}</span>
      <span className="text-stone-800 font-medium text-right">{value}</span>
    </div>
  );
}

export default function RedemptionDetailModal({ isOpen, onClose, redemption }) {
  if (!redemption) return null;

  const fulfillment = redemption.fulfillment;
  const status = redemption.status;

  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={Gift} title={redemption.reward?.name} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-stone-800">{redemption.points_cost?.toLocaleString()} pts</span>
          <StatusBadge size="lg" status={status} />
        </div>

        {redemption.student_note && (
          <div className="bg-stone-50 border border-stone-100 rounded-xl p-3">
            <p className="text-[11px] font-mono uppercase tracking-wider text-stone-400 font-semibold mb-1">
              Your note
            </p>
            <p className="text-sm text-stone-700">{redemption.student_note}</p>
          </div>
        )}

        {status === "PENDING" && (
          <p className="text-sm text-stone-500 font-light">Your redemption is waiting for admin approval.</p>
        )}

        {status === "APPROVED" && (
          <p className="text-sm text-stone-500 font-light">
            Your reward has been approved and is awaiting fulfillment.
          </p>
        )}

        {status === "SCHEDULED" && fulfillment && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
              <Calendar className="w-4 h-4" />
              {formatPlainDate(fulfillment.scheduled_date)}
            </div>
            {fulfillment.start_time && (
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Clock className="w-4 h-4" />
                {formatPlainTime(fulfillment.start_time)}
                {fulfillment.end_time ? ` – ${formatPlainTime(fulfillment.end_time)}` : ""}
              </div>
            )}
            {fulfillment.mentor && (
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <User className="w-4 h-4" />
                {fulfillment.mentor.name}
              </div>
            )}
            {fulfillment.meeting_url && (
              <a
                href={fulfillment.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-mono uppercase tracking-wider rounded-lg transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Join Session
              </a>
            )}
          </div>
        )}

        {status === "READY" && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-emerald-800">Your reward is ready to use.</p>
            {fulfillment?.notes && <p className="text-sm text-emerald-700 font-mono">{fulfillment.notes}</p>}
          </div>
        )}

        {status === "COMPLETED" && (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Reward successfully fulfilled.
          </div>
        )}

        {status === "CANCELLED" && (
          <div className="flex items-start gap-2 text-sm text-stone-600 bg-stone-50 border border-stone-100 rounded-xl p-4">
            <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              {redemption.cancellation_reason && <p className="mb-1">Reason: {redemption.cancellation_reason}</p>}
              <p className="font-semibold text-emerald-700">{redemption.points_cost?.toLocaleString()} points refunded.</p>
            </div>
          </div>
        )}

        <div className="border-t border-stone-100 pt-3">
          <InfoRow label="Redeemed" value={formatDateTime(redemption.created_at)} />
        </div>
      </div>
    </Modal>
  );
}
