"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CheckCircle2, Circle, HelpCircle, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createQuestion, updateQuestion } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = { text: "", question_type: "MCQ", marks: "1", order: "1" };

const QUESTION_TYPE_OPTIONS = [
  { value: "MCQ", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True / False" },
  { value: "SHORT_ANSWER", label: "Short Answer" },
];

const MCQ_CHOICE_COUNT = 4;
const CHOICE_LETTERS = ["A", "B", "C", "D"];

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS = "text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

function createChoicesForType(type) {
  if (type === "MCQ") {
    return Array.from({ length: MCQ_CHOICE_COUNT }, () => ({ text: "", is_correct: false }));
  }
  if (type === "TRUE_FALSE") {
    return [
      { text: "True", is_correct: false },
      { text: "False", is_correct: false },
    ];
  }
  return [];
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

export default function TeacherQuestionFormModal({ isOpen, onClose, quizId, question, nextOrder = 1 }) {
  const isEditMode = Boolean(question);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [pendingChoices, setPendingChoices] = useState([]);

  const createMutation = useMutation({
    mutationFn: (payload) => createQuestion(quizId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", quizId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuestion(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions", quizId] }),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    if (question) {
      setForm({
        text: question.text || "",
        question_type: question.question_type || "MCQ",
        marks: String(question.marks ?? 1),
        order: String(question.order ?? 1),
      });
      setPendingChoices([]);
    } else {
      setForm({ ...INITIAL_FORM, order: String(nextOrder) });
      setPendingChoices(createChoicesForType(INITIAL_FORM.question_type));
    }
    setFieldErrors({});
  }, [isOpen, question, nextOrder]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleTypeChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, question_type: value }));
    setFieldErrors((prev) => ({ ...prev, question_type: null, choices: null }));
    setPendingChoices(createChoicesForType(value));
  };

  const markPendingChoiceCorrect = (index) => {
    setPendingChoices((prev) => prev.map((choice, i) => ({ ...choice, is_correct: i === index })));
    setFieldErrors((prev) => ({ ...prev, choices: null }));
  };

  const updatePendingChoiceText = (index, text) => {
    setPendingChoices((prev) => prev.map((choice, i) => (i === index ? { ...choice, text } : choice)));
    setFieldErrors((prev) => ({ ...prev, choices: null }));
  };

  const validate = () => {
    const errors = {};
    const text = form.text.trim();

    if (!text) errors.text = "Question text is required.";

    const marks = Number(form.marks);
    if (!Number.isFinite(marks) || marks < 1 || !Number.isInteger(marks)) {
      errors.marks = "Marks must be a whole number of at least 1.";
    }

    const order = Number(form.order);
    if (!Number.isFinite(order) || order < 1 || !Number.isInteger(order)) {
      errors.order = "Order must be 1, 2, 3... only.";
    }

    if (!isEditMode && form.question_type !== "SHORT_ANSWER") {
      if (form.question_type === "MCQ" && pendingChoices.some((choice) => !choice.text.trim())) {
        errors.choices = "Enter text for all four answer choices.";
      } else if (!pendingChoices.some((choice) => choice.is_correct)) {
        errors.choices = "Select the correct answer before creating this question.";
      }
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
      text: form.text.trim(),
      question_type: form.question_type,
      marks: Number(form.marks),
      order: Number(form.order),
    };

    if (!isEditMode && form.question_type !== "SHORT_ANSWER") {
      payload.choices = pendingChoices.map((choice) => ({
        text: choice.text.trim(),
        is_correct: choice.is_correct,
      }));
    }

    try {
      const response = isEditMode
        ? await updateMutation.mutateAsync({ id: question.id, payload })
        : await createMutation.mutateAsync(payload);

      toastSuccess(response?.message || `Question ${isEditMode ? "updated" : "created"} successfully.`);
      onClose();
    } catch (error) {
      const mapped = extractFieldErrors(error);
      if (mapped) setFieldErrors(mapped);
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} question.`));
    }
  };

  const showChoiceBuilder = !isEditMode && form.question_type !== "SHORT_ANSWER";
  const isMcq = form.question_type === "MCQ";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={HelpCircle}
      title={isEditMode ? "Edit Question" : "Add Question"}
      subtitle={isEditMode ? "Update this question" : "Add a new question to this quiz"}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Question Text</label>
          <textarea
            value={form.text}
            onChange={updateField("text")}
            disabled={isSubmitting}
            placeholder="What is being asked?"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.text && <p className={ERROR_CLASS}>{fieldErrors.text}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className={LABEL_CLASS}>Type</label>
            <select
              value={form.question_type}
              onChange={handleTypeChange}
              disabled={isSubmitting || isEditMode}
              className={FIELD_CLASS}
            >
              {QUESTION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.question_type && <p className={ERROR_CLASS}>{fieldErrors.question_type}</p>}
          </div>
          <div>
            <label className={LABEL_CLASS}>Marks</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.marks}
              onChange={updateField("marks")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            {fieldErrors.marks && <p className={ERROR_CLASS}>{fieldErrors.marks}</p>}
          </div>
          <div>
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
            {fieldErrors.order && <p className={ERROR_CLASS}>{fieldErrors.order}</p>}
          </div>
        </div>

        {isEditMode && (
          <p className="text-[10px] font-mono text-stone-400 tracking-wider">
            Question type can&apos;t change after creation. Manage choices from the questions list.
          </p>
        )}

        {showChoiceBuilder && (
          <div>
            <label className={LABEL_CLASS}>Answer Choices</label>
            <ul className="space-y-2">
              {pendingChoices.map((choice, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => markPendingChoiceCorrect(index)}
                    disabled={isSubmitting}
                    title={choice.is_correct ? "Correct answer" : "Mark as correct"}
                    aria-label={choice.is_correct ? "Correct answer" : "Mark as correct"}
                    className={`w-6 h-6 flex items-center justify-center rounded-full shrink-0 transition cursor-pointer ${
                      choice.is_correct ? "text-emerald-600" : "text-stone-300 hover:text-emerald-500"
                    }`}
                  >
                    {choice.is_correct ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  {isMcq && (
                    <span className="w-5 shrink-0 text-xs font-bold font-mono text-stone-400">
                      {CHOICE_LETTERS[index]}.
                    </span>
                  )}
                  {isMcq ? (
                    <input
                      type="text"
                      value={choice.text}
                      onChange={(event) => updatePendingChoiceText(index, event.target.value)}
                      disabled={isSubmitting}
                      placeholder={`Choice ${CHOICE_LETTERS[index]}`}
                      className={FIELD_CLASS}
                    />
                  ) : (
                    <p className="flex-1 text-xs font-semibold text-stone-800">{choice.text}</p>
                  )}
                </li>
              ))}
            </ul>
            {fieldErrors.choices && <p className={ERROR_CLASS}>{fieldErrors.choices}</p>}
            <p className="text-[10px] font-mono text-stone-400 tracking-wider mt-1.5">
              Click the circle to mark the correct answer.
            </p>
          </div>
        )}

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
            disabled={isSubmitting}
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
                {isEditMode ? "Save Changes" : "Create Question"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
