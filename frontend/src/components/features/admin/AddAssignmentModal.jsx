"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardCheck, FileText, Paperclip, Plus, Trash2, Upload, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import AssignmentAttachmentsModal from "@/components/features/admin/AssignmentAttachmentsModal";
import {
  createAssignment,
  updateAssignment,
  uploadAssignmentAttachment,
} from "@/services/assignmentsService";
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
  order: "1",
  grading_method: "RUBRIC",
};

const EMPTY_CRITERION = { name: "", description: "", max_marks: "10" };

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
    value: "AI",
    label: "AI Grading",
    description: "Elite Coach AI grades each submission and assigns academic marks — see below.",
  },
];

const GRADING_METHOD_OPTIONS = [
  {
    value: "RUBRIC",
    label: "Rubric / Criteria Based",
    description: "Grade the whole submission holistically against named criteria (e.g. Understanding, Accuracy).",
  },
  {
    value: "QUESTION_BASED",
    label: "Question Based",
    description: "Grade each question separately — use when the assignment has clearly identifiable questions with their own marks.",
  },
];

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

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

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [rubricCriteria, setRubricCriteria] = useState([]);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const pendingAttachmentInputRef = useRef(null);

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
        order: String(assignment.order ?? 1),
        grading_method: assignment.rubric?.grading_method || "RUBRIC",
      });
      setRubricCriteria(
        (assignment.rubric?.criteria || []).map((criterion) => ({
          name: criterion.name || "",
          description: criterion.description || "",
          max_marks: String(criterion.max_marks ?? 10),
        }))
      );
    } else {
      const initialModuleId = defaultModuleId ? String(defaultModuleId) : String(modules[0]?.id || "");
      const initialModule = modules.find((module) => String(module.id) === initialModuleId);
      setForm({
        ...INITIAL_FORM,
        module: initialModuleId,
        order: String((initialModule?.assignments_count ?? 0) + 1),
      });
      setRubricCriteria([]);
    }
    setFieldErrors({});
    setPendingAttachments([]);
  }, [isOpen, defaultModuleId, assignment, modules]);

  const addCriterion = () => setRubricCriteria((prev) => [...prev, { ...EMPTY_CRITERION }]);
  const removeCriterion = (index) =>
    setRubricCriteria((prev) => prev.filter((_, i) => i !== index));
  const updateCriterion = (index, field, value) =>
    setRubricCriteria((prev) =>
      prev.map((criterion, i) => (i === index ? { ...criterion, [field]: value } : criterion))
    );

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handlePendingAttachmentChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length) {
      setPendingAttachments((prev) => [...prev, ...files]);
    }
    event.target.value = "";
  };

  const removePendingAttachment = (index) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateField = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleModuleChange = (event) => {
    const value = event.target.value;
    setForm((prev) => {
      if (isEditMode) return { ...prev, module: value };
      const selectedModule = modules.find((module) => String(module.id) === value);
      return { ...prev, module: value, order: String((selectedModule?.assignments_count ?? 0) + 1) };
    });
    setFieldErrors((prev) => ({ ...prev, module: null }));
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
    if (!Number.isFinite(order) || order < 1 || !Number.isInteger(order)) {
      errors.order = "Order must be 1, 2, 3... only.";
    }

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

    if (form.grading_mode === "AI") {
      payload.rubric = {
        grading_method: form.grading_method,
        criteria: rubricCriteria
          .filter((criterion) => criterion.name.trim())
          .map((criterion) => ({
            name: criterion.name.trim(),
            description: criterion.description.trim(),
            max_marks: Number(criterion.max_marks) || 10,
          })),
      };
    }

    try {
      const response = isEditMode
        ? await updateAssignmentMutation.mutateAsync({ id: assignment.id, payload })
        : await createAssignmentMutation.mutateAsync(payload);

      const newAssignmentId = response?.data?.id;
      if (!isEditMode && newAssignmentId && pendingAttachments.length > 0) {
        const results = await Promise.allSettled(
          pendingAttachments.map((file) => uploadAssignmentAttachment(newAssignmentId, file))
        );
        const failedCount = results.filter((result) => result.status === "rejected").length;
        if (failedCount > 0) {
          toastError(
            `Assignment created, but ${failedCount} of ${pendingAttachments.length} attachment(s) failed to upload.`
          );
        }
        queryClient.invalidateQueries({ queryKey: ["assignments", payload.module] });
        queryClient.invalidateQueries({ queryKey: ["assignment-attachments", newAssignmentId] });
      }

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

  const isQuestionBased = form.grading_method === "QUESTION_BASED";
  const itemNoun = isQuestionBased ? "Question" : "Criterion";
  const criteriaMarksSum = rubricCriteria.reduce(
    (sum, criterion) => sum + (Number(criterion.max_marks) || 0),
    0
  );
  const totalMarksNumber = Number(form.total_marks) || 0;
  const marksSumMismatch = form.grading_mode === "AI" && criteriaMarksSum !== totalMarksNumber;

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
            onChange={handleModuleChange}
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
              min="1"
              step="1"
              value={form.order}
              onChange={updateField("order")}
              onKeyDown={(event) => {
                if (event.key === "-" || event.key === "e" || event.key === "E" || event.key === "+") {
                  event.preventDefault();
                }
              }}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            <p className="mt-1.5 text-[11px] font-mono text-stone-400">1 = first position</p>
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
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                  form.grading_mode === option.value
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-mono text-stone-400 tracking-wider mt-1.5">
            {GRADING_MODE_OPTIONS.find((option) => option.value === form.grading_mode)?.description}
          </p>
        </div>

        {form.grading_mode === "AI" && (
          <div className="space-y-4 p-3 rounded-xl border border-amber-200 bg-amber-50/40">
            <div>
              <label className={LABEL_CLASS}>Grading Method</label>
              <div className="flex gap-2">
                {GRADING_METHOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, grading_method: option.value }))}
                    disabled={isSubmitting}
                    title={option.description}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold font-mono tracking-wider uppercase transition-all border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                      form.grading_method === option.value
                        ? "bg-stone-900 text-white border-stone-900"
                        : "bg-white text-stone-500 border-stone-200 hover:bg-stone-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-mono text-stone-400 tracking-wider mt-1.5">
                {GRADING_METHOD_OPTIONS.find((option) => option.value === form.grading_method)?.description}
              </p>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                {isQuestionBased ? "Questions" : "Grading Rubric Criteria"}
              </label>
              <div className="space-y-2">
                {rubricCriteria.map((criterion, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-start p-2.5 rounded-xl border border-stone-200 bg-white"
                  >
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        placeholder={isQuestionBased ? "Question label (e.g. Question 1)" : "Criterion name"}
                        value={criterion.name}
                        onChange={(event) => updateCriterion(index, "name", event.target.value)}
                        disabled={isSubmitting}
                        className={FIELD_CLASS}
                      />
                      <textarea
                        placeholder={isQuestionBased ? "The actual question text" : "Description (optional)"}
                        value={criterion.description}
                        onChange={(event) =>
                          updateCriterion(index, "description", event.target.value)
                        }
                        disabled={isSubmitting}
                        rows={2}
                        className={`${FIELD_CLASS} resize-none`}
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Marks"
                        value={criterion.max_marks}
                        onChange={(event) => updateCriterion(index, "max_marks", event.target.value)}
                        disabled={isSubmitting}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCriterion(index)}
                      disabled={isSubmitting}
                      title={`Remove ${itemNoun.toLowerCase()}`}
                      aria-label={`Remove ${itemNoun.toLowerCase()}`}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addCriterion}
                disabled={isSubmitting}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-stone-300 rounded-lg text-xs font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                Add {itemNoun}
              </button>
              <p
                className={`mt-1.5 text-[11px] font-mono tracking-wider ${
                  marksSumMismatch ? "text-amber-700 font-semibold" : "text-stone-400"
                }`}
              >
                {itemNoun} marks total: {criteriaMarksSum} / {totalMarksNumber || "—"}
                {marksSumMismatch ? " — must match Total Marks exactly before publishing." : ""}
              </p>
              {fieldErrors.rubric && <p className={ERROR_CLASS}>{fieldErrors.rubric}</p>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/60">
          <div>
            <p className="text-sm font-semibold text-stone-800">Allow Resubmission</p>
            <p className="text-[11px] font-mono text-stone-400 tracking-wider mt-0.5">
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
              className="w-full flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl text-xs font-mono uppercase tracking-wider text-stone-600 bg-stone-50/60 hover:bg-stone-100 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5" />
              Manage Attachments
            </button>
          ) : (
            <div className="space-y-2">
              {pendingAttachments.length > 0 && (
                <ul className="space-y-2">
                  {pendingAttachments.map((file, index) => (
                    <li
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-stone-200 bg-white"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-stone-800 truncate">{file.name}</p>
                        <p className="text-[11px] font-mono uppercase text-stone-400 tracking-wider mt-0.5">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePendingAttachment(index)}
                        disabled={isSubmitting}
                        title="Remove attachment"
                        aria-label="Remove attachment"
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={pendingAttachmentInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handlePendingAttachmentChange}
              />
              <button
                type="button"
                onClick={() => pendingAttachmentInputRef.current?.click()}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-xs font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Upload className="w-3.5 h-3.5" />
                Add Attachment
              </button>
              <p className="text-[11px] font-mono text-stone-400 tracking-wider">
                Files upload once the assignment is created · PDF, DOC/DOCX, PPT/PPTX, ZIP, JPG/PNG/WEBP · up to
                50MB
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || modules.length === 0}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
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
          <p className="text-[11px] font-mono text-amber-700 flex items-center gap-1.5">
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
