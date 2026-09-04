"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, HelpCircle, ListChecks, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import TeacherQuizQuestionsModal from "@/components/features/teachers/TeacherQuizQuestionsModal";
import { createQuiz, updateQuiz } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = {
  module: "",
  title: "",
  description: "",
  passing_score: "40",
  time_limit_minutes: "0",
  attempts_allowed: "3",
  available_from: "",
  available_until: "",
  order: "1",
  short_answer_grading_mode: "MANUAL",
};

const SHORT_ANSWER_GRADING_MODE_OPTIONS = [
  {
    value: "MANUAL",
    label: "Manual Review",
    description: "Short-answer responses queue for a teacher to grade by hand.",
  },
  {
    value: "AI",
    label: "AI Grading",
    description: "AI grades short-answer responses automatically, with partial credit. MCQ/True-False are always graded deterministically either way.",
  },
];

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS = "text-[11px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

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
  if (!datetimeLocalValue) return null;
  const date = new Date(datetimeLocalValue);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
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

export default function TeacherQuizFormModal({ isOpen, onClose, modules = [], defaultModuleId, quiz, onSaved }) {
  const isEditMode = Boolean(quiz);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);

  const createQuizMutation = useMutation({
    mutationFn: (payload) => createQuiz(payload),
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", payload.module] });
    },
  });

  const updateQuizMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuiz(id, payload),
    onSuccess: (_data, { payload }) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", payload.module] });
    },
  });

  const isSubmitting = createQuizMutation.isPending || updateQuizMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    if (quiz) {
      setForm({
        module: String(quiz.module?.id ?? quiz.module ?? ""),
        title: quiz.title || "",
        description: quiz.description || "",
        passing_score: String(quiz.passing_score ?? 40),
        time_limit_minutes: String(quiz.time_limit_minutes ?? 0),
        attempts_allowed: String(quiz.attempts_allowed ?? 3),
        available_from: toDatetimeLocalValue(quiz.available_from),
        available_until: toDatetimeLocalValue(quiz.available_until),
        order: String(quiz.order ?? 1),
        short_answer_grading_mode: quiz.short_answer_grading_mode || "MANUAL",
      });
    } else {
      const initialModuleId = defaultModuleId ? String(defaultModuleId) : String(modules[0]?.id || "");
      const initialModule = modules.find((module) => String(module.id) === initialModuleId);
      setForm({
        ...INITIAL_FORM,
        module: initialModuleId,
        order: String((initialModule?.quizzes_count ?? 0) + 1),
      });
    }
    setFieldErrors({});
  }, [isOpen, defaultModuleId, quiz, modules]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleModuleChange = (event) => {
    const value = event.target.value;
    setForm((prev) => {
      if (isEditMode) return { ...prev, module: value };
      const selectedModule = modules.find((module) => String(module.id) === value);
      return { ...prev, module: value, order: String((selectedModule?.quizzes_count ?? 0) + 1) };
    });
    setFieldErrors((prev) => ({ ...prev, module: null }));
  };

  const validate = () => {
    const errors = {};
    const title = form.title.trim();

    if (!form.module) errors.module = "Module is required.";
    if (!title) errors.title = "Title is required.";
    if (title.length > 255) errors.title = "Title must be at most 255 characters.";

    const passingScore = Number(form.passing_score);
    if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) {
      errors.passing_score = "Passing score must be between 0 and 100.";
    }

    const timeLimit = Number(form.time_limit_minutes);
    if (!Number.isFinite(timeLimit) || timeLimit < 0 || !Number.isInteger(timeLimit)) {
      errors.time_limit_minutes = "Time limit must be 0 or a whole number of minutes.";
    }

    const attemptsAllowed = Number(form.attempts_allowed);
    if (!Number.isFinite(attemptsAllowed) || attemptsAllowed < 1 || !Number.isInteger(attemptsAllowed)) {
      errors.attempts_allowed = "Attempts allowed must be at least 1.";
    }

    if (form.available_from && form.available_until) {
      const from = new Date(form.available_from);
      const until = new Date(form.available_until);
      if (until <= from) {
        errors.available_until = "Available until must be after available from.";
      }
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
      passing_score: Number(form.passing_score),
      time_limit_minutes: Number(form.time_limit_minutes),
      attempts_allowed: Number(form.attempts_allowed),
      available_from: toIsoString(form.available_from),
      available_until: toIsoString(form.available_until),
      order: Number(form.order),
      short_answer_grading_mode: form.short_answer_grading_mode,
    };

    try {
      const response = isEditMode
        ? await updateQuizMutation.mutateAsync({ id: quiz.id, payload })
        : await createQuizMutation.mutateAsync(payload);

      toastSuccess(response?.message || `Quiz ${isEditMode ? "updated" : "created"} successfully.`);
      onSaved?.(response?.data);
      onClose();
    } catch (error) {
      const mapped = extractFieldErrors(error);
      if (mapped) setFieldErrors(mapped);
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} quiz.`));
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isQuestionsModalOpen}
        onClose={handleClose}
        icon={HelpCircle}
        title={isEditMode ? "Edit Quiz" : "Add Quiz"}
        subtitle={isEditMode ? quiz?.title : "Create a new quiz for this module"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {isEditMode && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-stone-200 bg-stone-50/60">
              <div>
                <p className="text-sm font-semibold text-stone-800">Status</p>
                <p className="text-[11px] font-mono text-stone-400 tracking-wider mt-0.5">
                  Publish this quiz from the quizzes list once it has questions.
                </p>
              </div>
              <StatusBadge status={quiz?.status} size="lg" />
            </div>
          )}

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
            <label className={LABEL_CLASS}>Quiz Title</label>
            <input
              type="text"
              value={form.title}
              onChange={updateField("title")}
              disabled={isSubmitting}
              placeholder="Quiz title"
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
              placeholder="Quiz instructions"
              rows={3}
              className={`${FIELD_CLASS} resize-none`}
            />
            {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={LABEL_CLASS}>Passing Score %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.passing_score}
                onChange={updateField("passing_score")}
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
              {fieldErrors.passing_score && <p className={ERROR_CLASS}>{fieldErrors.passing_score}</p>}
            </div>
            <div>
              <label className={LABEL_CLASS}>Time Limit (min)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.time_limit_minutes}
                onChange={updateField("time_limit_minutes")}
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
              <p className="mt-1.5 text-[11px] font-mono text-stone-400">0 = no limit</p>
              {fieldErrors.time_limit_minutes && <p className={ERROR_CLASS}>{fieldErrors.time_limit_minutes}</p>}
            </div>
            <div>
              <label className={LABEL_CLASS}>Attempts Allowed</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.attempts_allowed}
                onChange={updateField("attempts_allowed")}
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
              {fieldErrors.attempts_allowed && <p className={ERROR_CLASS}>{fieldErrors.attempts_allowed}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>Available From</label>
              <input
                type="datetime-local"
                value={form.available_from}
                onChange={updateField("available_from")}
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
              {fieldErrors.available_from && <p className={ERROR_CLASS}>{fieldErrors.available_from}</p>}
            </div>
            <div>
              <label className={LABEL_CLASS}>Available Until</label>
              <input
                type="datetime-local"
                value={form.available_until}
                onChange={updateField("available_until")}
                disabled={isSubmitting}
                className={FIELD_CLASS}
              />
              {fieldErrors.available_until && <p className={ERROR_CLASS}>{fieldErrors.available_until}</p>}
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS}>Short-Answer Grading</label>
            <div className="flex gap-2">
              {SHORT_ANSWER_GRADING_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, short_answer_grading_mode: option.value }))
                  }
                  disabled={isSubmitting}
                  title={option.description}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-semibold font-mono tracking-wider uppercase transition-all border disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                    form.short_answer_grading_mode === option.value
                      ? "bg-stone-900 text-white border-stone-900"
                      : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] font-mono text-stone-400 tracking-wider mt-1.5">
              {
                SHORT_ANSWER_GRADING_MODE_OPTIONS.find(
                  (option) => option.value === form.short_answer_grading_mode
                )?.description
              }
            </p>
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
                if (["-", "e", "E", "+"].includes(event.key)) event.preventDefault();
              }}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            <p className="mt-1.5 text-[11px] font-mono text-stone-400">1 = first position</p>
            {fieldErrors.order && <p className={ERROR_CLASS}>{fieldErrors.order}</p>}
          </div>

          {isEditMode && (
            <div>
              <label className={LABEL_CLASS}>Questions</label>
              <button
                type="button"
                onClick={() => setIsQuestionsModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border border-stone-200 rounded-xl text-xs font-mono uppercase tracking-wider text-stone-600 bg-stone-50/60 hover:bg-stone-100 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
              >
                <ListChecks className="w-3.5 h-3.5" />
                Manage Questions
              </button>
            </div>
          )}

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
                  {isEditMode ? "Save Changes" : "Create Quiz"}
                </>
              )}
            </button>
          </div>

          {modules.length === 0 && (
            <p className="text-[11px] font-mono text-amber-700 flex items-center gap-1.5">
              Create a module first before adding a quiz.
            </p>
          )}
        </form>
      </Modal>

      {isEditMode && (
        <TeacherQuizQuestionsModal
          isOpen={isQuestionsModalOpen}
          onClose={() => setIsQuestionsModalOpen(false)}
          quiz={quiz}
        />
      )}
    </>
  );
}
