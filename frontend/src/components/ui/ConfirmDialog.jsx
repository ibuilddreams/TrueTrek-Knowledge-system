"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  isConfirming = false,
  tone = "danger",
  size = "base",
  // The palette, not the intent: `tone` above still says danger vs primary.
  // "cobalt" is the portal dialog, and is passed straight through to Modal so
  // the frame and the buttons can never disagree about which design they are.
  variant = "classic",
}) {
  const isCobalt = variant === "cobalt";
  return (
    <Modal
      isOpen={isOpen}
      onClose={isConfirming ? undefined : onClose}
      icon={AlertTriangle}
      title={title}
      subtitle={message}
      maxWidth="max-w-sm"
      variant={variant}
    >
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isConfirming}
          className={
            isCobalt
              ? "inline-flex h-11 items-center justify-center gap-2 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-[18px] text-sm font-semibold text-cn-p-ink transition-colors hover:border-cn-p-ink disabled:cursor-not-allowed disabled:opacity-60"
              : `px-4 py-3 ${size === "lg" ? "text-sm" : "text-xs"} font-semibold font-sans rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed bg-porcelain hover:bg-paper text-ink border-line`
          }
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className={
            isCobalt
              ? `inline-flex h-11 items-center justify-center gap-2 rounded-cn-p-sm px-[18px] text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  tone === "danger"
                    ? "bg-cn-p-bad hover:bg-cn-p-bad/90"
                    : "bg-cn-p-accent hover:bg-cn-p-accent-hover"
                }`
              : `px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-paper ${size === "lg" ? "text-sm" : "text-xs"} font-semibold font-sans rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 ${
                  tone === "danger"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-pine hover:bg-moss"
                }`
          }
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
