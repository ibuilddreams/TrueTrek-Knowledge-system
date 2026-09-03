"use client";

import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60 resize-none";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export default function CancelRedemptionModal({ isOpen, onClose, onConfirm, redemption, isSubmitting }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("A cancellation reason is required.");
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : handleClose}
      icon={XCircle}
      title="Cancel Redemption"
      subtitle={
        redemption
          ? `Cancelling will refund ${redemption.points_cost?.toLocaleString()} points to ${redemption.student?.name || "the student"}.`
          : undefined
      }
      maxWidth="max-w-sm"
    >
      <div className="mb-6">
        <label className="text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold">
          Reason
        </label>
        <textarea
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            setError("");
          }}
          disabled={isSubmitting}
          placeholder="Why is this redemption being cancelled?"
          rows={3}
          className={FIELD_CLASS}
        />
        {error && <p className={ERROR_CLASS}>{error}</p>}
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Cancelling...
            </>
          ) : (
            "Cancel Redemption & Refund"
          )}
        </button>
      </div>
    </Modal>
  );
}
