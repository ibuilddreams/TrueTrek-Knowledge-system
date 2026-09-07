"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldAlert, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createStudentConcern } from "@/services/studentConcernsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const CATEGORY_OPTIONS = [
  { value: "ACADEMIC", label: "Academic" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "SAFETY", label: "Safety" },
  { value: "OTHER", label: "Other" },
];

const INITIAL_FORM = {
  category: "ACADEMIC",
  description: "",
  requires_admin_attention: false,
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export default function FlagConcernModal({ isOpen, onClose, studentId, studentName }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const createConcernMutation = useMutation({
    mutationFn: (payload) => createStudentConcern(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-concerns", "mine"] }),
  });

  const isSubmitting = createConcernMutation.isPending;

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
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const description = form.description.trim();
    if (!description) {
      setFieldErrors({ description: "Description is required." });
      return;
    }

    try {
      const response = await createConcernMutation.mutateAsync({
        student: studentId,
        category: form.category,
        description,
        requires_admin_attention: form.requires_admin_attention,
      });
      toastSuccess(response?.message || "Concern submitted successfully.");
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
      toastError(getApiErrorMessage(error, "Unable to submit concern."));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={ShieldAlert}
      title="Flag a Student Concern"
      subtitle={studentName ? `About ${studentName}` : "Let the admin team know about a concern."}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Category</label>
          <select
            value={form.category}
            onChange={updateField("category")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isSubmitting}
            placeholder="Describe what you've observed and why it's a concern."
            rows={5}
            maxLength={5000}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <label className="flex items-start gap-2.5 text-sm text-stone-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.requires_admin_attention}
            onChange={updateField("requires_admin_attention")}
            disabled={isSubmitting}
            className="mt-0.5 w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-600"
          />
          <span>
            This requires admin attention now
            <span className="block text-[11px] text-stone-400 font-light mt-0.5">
              Every admin will get an in-app notification immediately.
            </span>
          </span>
        </label>

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
                Submit Concern
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
