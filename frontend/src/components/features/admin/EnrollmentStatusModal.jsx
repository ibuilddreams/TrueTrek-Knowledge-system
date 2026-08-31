"use client";

import { useEffect, useState } from "react";
import { Edit3 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { updateEnrollmentStatus } from "@/services/enrollmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default function EnrollmentStatusModal({ isOpen, onClose, enrollment, onUpdated }) {
  const [status, setStatus] = useState(enrollment?.status || "");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStatus(enrollment?.status || "");
      setNote("");
    }
  }, [isOpen, enrollment]);

  const handleClose = () => {
    if (isSubmitting) return;
    setNote("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!status || !note.trim()) {
      toastError("Please choose a status and add a note.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await updateEnrollmentStatus(enrollment.id, { status, note: note.trim() });
      toastSuccess(response?.message || "Enrollment status updated successfully.");
      onUpdated?.();
      handleClose();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to update enrollment status."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enrollment) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Edit3}
      title="Update Enrollment Status"
      subtitle={`${enrollment.student?.name} · ${enrollment.course?.title}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <SearchableSelect size="lg"
          label="Status"
          placeholder="Select a status"
          options={STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
          disabled={isSubmitting}
        />

        <div>
          <label className="text-[11px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold">
            Note
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isSubmitting}
            rows={3}
            placeholder="Reason for this status change"
            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
