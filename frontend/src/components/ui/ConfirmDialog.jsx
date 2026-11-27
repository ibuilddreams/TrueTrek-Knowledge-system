"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";

/**
 * A yes/no dialog, in the one design the product has.
 *
 * `tone` is the intent — whether confirming is destructive — and is the only
 * thing left that changes how this looks. The `variant` and `size` props it
 * used to take belonged to the porcelain design: `variant` chose between the
 * two shells, and `size` only ever adjusted the classic branch's button text.
 * Both went with that branch.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  isConfirming = false,
  tone = "danger",
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isConfirming ? undefined : onClose}
      icon={AlertTriangle}
      title={title}
      subtitle={message}
      maxWidth="max-w-sm"
    >
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isConfirming}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-[18px] text-sm font-semibold text-cn-p-ink transition-colors hover:border-cn-p-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-cn-p-sm px-[18px] text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
            tone === "danger"
              ? "bg-cn-p-bad hover:bg-cn-p-bad/90"
              : "bg-cn-p-accent hover:bg-cn-p-accent-hover"
          }`}
        >
          {isConfirming ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </Modal>
  );
}
