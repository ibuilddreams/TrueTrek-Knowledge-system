"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import Modal from "@/components/ui/Modal";

// Task 18 (Phase 5) — the "path to continue improving" once a student has
// exhausted a quiz's attempts_allowed without passing (and, if that quiz is
// module-linked, is locked out of the rest of the course — see
// progress.services.get_module_lock_map). A reason is required, mirroring
// the backend's validation and the same non-blank-reason convention as
// rewards' manual points adjustment, so there's always an audit trail for
// why a specific student got extra chances.
export default function GrantQuizAttemptModal({ isOpen, onClose, onConfirm, row, isSubmitting }) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  const trimmedReason = reason.trim();
  const canSubmit = trimmedReason.length > 0 && !isSubmitting;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      icon={RefreshCw}
      title="Grant Extra Attempt"
      subtitle={row ? `${row.student.name} · ${row.quiz.title}` : ""}
      maxWidth="max-w-sm"
    >
      {row ? (
        <p className="text-xs text-stone-500 mb-4 leading-relaxed">
          {row.student.name} has used all {row.attempts_allowed} allowed attempts on this quiz
          without passing. Granting an extra attempt lets them retry it — and, if it was blocking
          progress into a later module, that module unlocks automatically once they pass.
        </p>
      ) : null}

      <div className="mb-6">
        <label className="text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold">
          Reason (required)
        </label>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          disabled={isSubmitting}
          placeholder="e.g. Was sick during the exam window, requesting a fair retry"
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
          onClick={() => onConfirm(trimmedReason)}
          disabled={!canSubmit}
          className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Granting...
            </>
          ) : (
            "Grant Attempt"
          )}
        </button>
      </div>
    </Modal>
  );
}
