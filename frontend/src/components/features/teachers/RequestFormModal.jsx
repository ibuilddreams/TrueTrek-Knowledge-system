"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, FileWarning, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createTeacherRequest } from "@/services/teacherRequestsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const REQUEST_TYPE_OPTIONS = [
  { value: "CHANGE_REQUEST", label: "Request a Change" },
  { value: "ERROR_REPORT", label: "Report an Error" },
];

const INITIAL_FORM = {
  request_type: "CHANGE_REQUEST",
  title: "",
  description: "",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export default function RequestFormModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const createRequestMutation = useMutation({
    mutationFn: (payload) => createTeacherRequest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher-requests", "mine"] }),
  });

  const isSubmitting = createRequestMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setFieldErrors({});
  }, [isOpen]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const description = form.description.trim();

    const errors = {};
    if (!title) errors.title = "Title is required.";
    if (!description) errors.description = "Description is required.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const response = await createRequestMutation.mutateAsync({
        request_type: form.request_type,
        title,
        description,
      });
      toastSuccess(response?.message || "Request submitted successfully.");
      handleClose();
    } catch (error) {
      const apiFieldErrors = error?.data?.data;
      if (apiFieldErrors && typeof apiFieldErrors === "object") {
        const mapped = {};
        Object.entries(apiFieldErrors).forEach(([key, value]) => {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(mapped);
      }
      toastError(getApiErrorMessage(error, "Unable to submit request."));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={FileWarning}
      title="Request a Change / Report an Error"
      subtitle="Let the admin team know what needs attention — you'll be able to track its status here."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Request Type</label>
          <select
            value={form.request_type}
            onChange={updateField("request_type")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          >
            {REQUEST_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            disabled={isSubmitting}
            placeholder="e.g. Change lesson video for Module 2"
            maxLength={255}
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isSubmitting}
            placeholder="Clearly explain what needs to be changed or what the error is."
            rows={5}
            maxLength={5000}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
