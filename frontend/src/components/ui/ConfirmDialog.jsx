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
          className={`px-4 py-3 ${size === "lg" ? "text-sm" : "text-xs"} font-semibold font-sans rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed bg-porcelain hover:bg-white text-ink border-line`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className={`px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-paper ${size === "lg" ? "text-sm" : "text-xs"} font-semibold font-sans rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 ${
            tone === "danger"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-pine hover:bg-moss"
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
