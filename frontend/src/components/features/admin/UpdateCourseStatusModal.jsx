"use client";

import { useEffect, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { getCourseStatusChoices, updateCourse } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";

export default function UpdateCourseStatusModal({ isOpen, onClose, course, onUpdated }) {
  const [statusOptions, setStatusOptions] = useState([]);
  const [status, setStatus] = useState("");
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !course) return;

    setStatus(course.status || "");

    let isMounted = true;
    setIsLoadingOptions(true);

    (async () => {
      try {
        const response = await getCourseStatusChoices();
        if (isMounted) setStatusOptions(response?.data || []);
      } catch (error) {
        if (isMounted) toastError(getApiErrorMessage(error, "Unable to load status options."));
      } finally {
        if (isMounted) setIsLoadingOptions(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, course]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!course || !status) return;

    setIsSubmitting(true);
    try {
      const response = await updateCourse(course.id, { status });
      toastSuccess(response?.message || "Course status updated successfully.");
      onUpdated?.();
      handleClose();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to update course status."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) return null;

  return (
    <Modal variant="cobalt"
      isOpen={isOpen}
      onClose={handleClose}
      icon={RefreshCw}
      title="Update status"
      subtitle={course.title}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Status</label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={isSubmitting || isLoadingOptions}
            className={`${FIELD_CLASS} cn-p-select`}
          >
            {statusOptions.length === 0 && <option value={status}>Loading...</option>}
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-cn-p-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || isLoadingOptions}
            className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Update status
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
