"use client";

import { useEffect, useState } from "react";
import { PackageCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function MarkReadyModal({ isOpen, onClose, onConfirm, redemption, isSubmitting }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) setNotes("");
  }, [isOpen]);

  return (
    <Modal variant="cobalt"
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      icon={PackageCheck}
      title="Mark as ready"
      subtitle={`${redemption?.reward?.name} — attach a digital code or access instructions if applicable.`}
      maxWidth="max-w-sm"
    >
      <div className="mb-6">
        <label className="text-xs font-sans text-cn-p-ink-2 block mb-1.5 font-medium">
          Code / Instructions (optional)
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. CODE: SAVE20"
          rows={3}
          className="w-full px-4 py-3 bg-cn-p-page border border-cn-p-line focus:border-cn-p-accent focus:bg-cn-p-card focus:outline-none rounded-xl text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60 resize-none"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-xs font-semibold rounded-cn-p-sm transition-colors duration-150 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(notes.trim())}
          disabled={isSubmitting}
          className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            "Mark Ready"
          )}
        </button>
      </div>
    </Modal>
  );
}
