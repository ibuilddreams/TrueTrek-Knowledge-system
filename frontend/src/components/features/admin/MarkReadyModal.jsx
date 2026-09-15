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
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      icon={PackageCheck}
      title="Mark as Ready"
      subtitle={`${redemption?.reward?.name} — attach a digital code or access instructions if applicable.`}
      maxWidth="max-w-sm"
    >
      <div className="mb-6">
        <label className="text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium">
          Code / Instructions (optional)
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. CODE: SAVE20"
          rows={3}
          className="w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60 resize-none"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-3 bg-transparent hover:bg-porcelain text-ink text-xs font-semibold font-mono rounded-full tracking-wider transition-colors duration-150 border border-line shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(notes.trim())}
          disabled={isSubmitting}
          className="px-6 py-3 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper text-xs font-semibold font-mono rounded-full tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
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
