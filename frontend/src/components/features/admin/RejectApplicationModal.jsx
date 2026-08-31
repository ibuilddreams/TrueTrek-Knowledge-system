"use client";

import { useEffect, useState } from "react";
import { Ban, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { rejectFutureClientApplication } from "@/services/futureClientsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

export default function RejectApplicationModal({ isOpen, onClose, application, onRejected }) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const rejectionReason = reason.trim();
    if (!rejectionReason) {
      toastError("Please provide a reason for rejecting this application.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await rejectFutureClientApplication(application.id, rejectionReason);
      toastSuccess(response?.message || "Application rejected.");
      onRejected?.();
      handleClose();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to reject application."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Ban}
      title="Reject Application"
      subtitle={application ? `Reject ${application.full_name}'s application.` : undefined}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold">
            Rejection Reason
          </label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isSubmitting}
            rows={4}
            placeholder="Let the applicant know why this application isn't moving forward..."
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60 resize-none"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <Ban className="w-3.5 h-3.5" />
                Reject Application
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
