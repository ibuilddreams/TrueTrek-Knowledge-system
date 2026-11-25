"use client";

import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60 resize-none";

const ERROR_CLASS = "text-[11px] text-cn-p-bad mt-1";

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
    <Modal variant="cobalt"
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : handleClose}
      icon={XCircle}
      title="Cancel redemption"
      subtitle={
        redemption
          ? `Cancelling will refund ${redemption.points_cost?.toLocaleString()} points to ${redemption.student?.name || "the student"}.`
          : undefined
      }
      maxWidth="max-w-sm"
    >
      <div className="mb-6">
        <label className="text-xs font-sans text-cn-p-ink-2 block mb-1.5 font-medium">
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
          className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-xs font-semibold rounded-cn-p-sm transition-colors duration-150 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="px-6 py-3 bg-cn-p-bad hover:bg-cn-p-bad disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-full transition-colors duration-150 flex items-center justify-center gap-2"
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
