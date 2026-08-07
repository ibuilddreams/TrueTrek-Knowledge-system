"use client";

import { AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useTheme } from "@/hooks/useTheme";

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
  const { isVault } = useTheme();

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
          className={`px-4 py-3 text-xs font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
            isVault
              ? "bg-stone-800/60 hover:bg-stone-800 text-stone-300 border-stone-700"
              : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
          }`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className={`px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 ${
            tone === "danger"
              ? "bg-rose-600 hover:bg-rose-700"
              : isVault
                ? "bg-stone-700 hover:bg-stone-600"
                : "bg-stone-900 hover:bg-stone-800"
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
