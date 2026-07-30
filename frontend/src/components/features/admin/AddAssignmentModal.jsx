"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, Paperclip, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AssignmentAttachmentsModal from "@/components/features/admin/AssignmentAttachmentsModal";
import { createAssignment, updateAssignment } from "@/services/assignmentsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = {
  module: "",
  title: "",
  description: "",
  due_date: "",
  total_marks: "100",
  status: "DRAFT",
  grading_mode: "MANUAL",
  allow_resubmission: false,
  order: "0",
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const GRADING_MODE_OPTIONS = [
  {
    value: "MANUAL",
    label: "Manual Review",
    description: "A teacher grades each submission by hand.",
  },
  {
    value: "AUTO",
    label: "Auto-Check on Submit",
    description: "Submissions are automatically marked complete with full marks.",
  },
];

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

function toDatetimeLocalValue(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function toIsoString(datetimeLocalValue) {
  if (!datetimeLocalValue) return "";
  const date = new Date(datetimeLocalValue);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function extractFieldErrors(error) {
  const apiFieldErrors = error?.data?.data;
  if (apiFieldErrors && typeof apiFieldErrors === "object") {
    const mapped = {};
    Object.entries(apiFieldErrors).forEach(([key, value]) => {
      mapped[key] = Array.isArray(value) ? value[0] : String(value);
    });
    return mapped;
  }
  return null;
}

export default function AddAssignmentModal({
  isOpen,
  onClose,
  modules = [],
  defaultModuleId,
  assignment,
  onSaved,
}) {
  const isEditMode = Boolean(assignment);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);

  const createAssignmentMutation = useMutation({
    mutationFn: (payload) => createAssignment(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", payload.module] });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAssignment(id, payload),
    onSuccess: (_data, { payload }) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", payload.module] });
    },
  });

  const isSubmitting = createAssignmentMutation.isPending || updateAssignmentMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    if (assignment) {
      setForm({
        module: String(assignment.module?.id ?? assignment.module ?? ""),
        title: assignment.title || "",
        description: assignment.description || "",
        due_date: toDatetimeLocalValue(assignment.due_date),
        total_marks: String(assignment.total_marks ?? 100),
        status: assignment.status || "DRAFT",
        grading_mode: assignment.grading_mode || "MANUAL",
        allow_resubmission: Boolean(assignment.allow_resubmission),
        order: String(assignment.order ?? 0),
      });
    } else {
      setForm({
        ...INITIAL_FORM,
        module: defaultModuleId ? String(defaultModuleId) : String(modules[0]?.id || ""),
      });
    }
    setFieldErrors({});
  }, [isOpen, defaultModuleId, assignment, modules]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errors = {};
    const title = form.title.trim();

    if (!form.module) errors.module = "Module is required.";
    if (!title) errors.title = "Title is required.";
    if (title.length > 255) errors.title = "Title must be at most 255 characters.";
    if (!form.due_date) errors.due_date = "Due date is required.";

    const totalMarks = Number(form.total_marks);
    if (!Number.isFinite(totalMarks) || totalMarks <= 0) {
      errors.total_marks = "Total marks must be greater than zero.";
    }

    const order = Number(form.order);
    if (!Number.isFinite(order) || order < 0) errors.order = "Order must be a positive number.";

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      module: Number(form.module),
      title: form.title.trim(),
      description: form.description.trim(),
      due_date: toIsoString(form.due_date),
      total_marks: Number(form.total_marks),
      status: form.status,
      grading_mode: form.grading_mode,
      allow_resubmission: form.allow_resubmission,
      order: Number(form.order),
    };

    try {
      const response = isEditMode
        ? await updateAssignmentMutation.mutateAsync({ id: assignment.id, payload })
        : await createAssignmentMutation.mutateAsync(payload);
      toastSuccess(
        response?.message || `Assignment ${isEditMode ? "updated" : "created"} successfully.`
      );
      onSaved?.(response?.data);
      onClose();
    } catch (error) {
      const mapped = extractFieldErrors(error);
      if (mapped) setFieldErrors(mapped);
      toastError(
        getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} assignment.`)
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={ClipboardCheck}
      title={isEditMode ? "Edit Assignment" : "Add Assignment"}
      subtitle={isEditMode ? assignment?.title : "Create a new assignment for this module"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Module</label>
          <select
            value={form.module}
            onChange={updateField("module")}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          >
            <option value="">Select a module</option>
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.title}
              </option>
            ))}
          </select>
          {fieldErrors.module && <p className={ERROR_CLASS}>{fieldErrors.module}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Assignment Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            disabled={isSubmitting}
            placeholder="Assignment title"
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
            placeholder="Assignment instructions"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Due Date</label>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={updateField("due_date")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            {fieldErrors.due_date && <p className={ERROR_CLASS}>{fieldErrors.due_date}</p>}
          </div>
          <div>
            <label className={LABEL_CLASS}>Total Marks</label>
            <input
              type="number"
              min="1"
              value={form.total_marks}
              onChange={updateField("total_marks")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            {fieldErrors.total_marks && <p className={ERROR_CLASS}>{fieldErrors.total_marks}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={form.status}
              onChange={updateField("status")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.status && <p className={ERROR_CLASS}>{fieldErrors.status}</p>}
          </div>
          <div className="w-32">
            <label className={LABEL_CLASS}>Order</label>
            <input
              type="number"
              min="0"
              value={form.order}
              onChange={updateField("order")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            {fieldErrors.order && <p className={ERROR_CLASS}>{fieldErrors.order}</p>}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Grading</label>
          <div className="flex gap-2">
            {GRADING_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, grading_mode: option.value }))}
                disabled={isSubmitting}
                title={option.description}
                className={`flex-1 px-3 py-2.5 rounded-xl text-[11px] font-semibold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                  form.grading_mode === option.value
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-mono text-stone-400 tracking-wider mt-1.5">
            {GRADING_MODE_OPTIONS.find((option) => option.value === form.grading_mode)?.description}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/60">
          <div>
            <p className="text-xs font-semibold text-stone-800">Allow Resubmission</p>
            <p className="text-[10px] font-mono text-stone-400 tracking-wider mt-0.5">
              Let students resubmit after the due date
            </p>
          </div>
          <input
            type="checkbox"
            checked={form.allow_resubmission}
            onChange={updateField("allow_resubmission")}
            disabled={isSubmitting}
            className="w-4 h-4 accent-amber-600 cursor-pointer"
          />
        </div>

        <div>
          <label className={LABEL_CLASS}>Attachments</label>
          {isEditMode ? (
            <button
              type="button"
              onClick={() => setIsAttachmentsModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl text-[11px] font-mono uppercase tracking-wider text-stone-600 bg-stone-50/60 hover:bg-stone-100 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Manage Attachments
            </button>
          ) : (
            <p className="text-[10px] font-mono text-stone-400 tracking-wider p-3 rounded-xl border border-dashed border-stone-200">
              Save the assignment first to attach reference files.
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || modules.length === 0}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Saving..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Save Changes" : "Create Assignment"}
              </>
            )}
          </button>
        </div>

        {modules.length === 0 && (
          <p className="text-[10px] font-mono text-amber-700 flex items-center gap-1.5">
            Create a module first before adding an assignment.
          </p>
        )}
      </form>

      {isEditMode && (
        <AssignmentAttachmentsModal
          isOpen={isAttachmentsModalOpen}
          onClose={() => setIsAttachmentsModalOpen(false)}
          assignment={assignment}
          moduleId={assignment.module?.id ?? assignment.module}
        />
      )}
    </Modal>
  );
}
