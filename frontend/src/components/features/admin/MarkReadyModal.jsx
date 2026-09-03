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
        <label className="text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold">
          Code / Instructions (optional)
        </label>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. CODE: SAVE20"
          rows={3}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60 resize-none"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(notes.trim())}
          disabled={isSubmitting}
          className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
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
