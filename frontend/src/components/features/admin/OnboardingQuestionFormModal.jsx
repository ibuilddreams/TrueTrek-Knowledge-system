"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, HelpCircle, Plus, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import QuestionOptionRow from "@/components/features/admin/QuestionOptionRow";
import { createQuestion, updateQuestion } from "@/services/onboardingService";
import { getAdminPathways } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

const INITIAL_FORM = { text: "", order: "1", is_multi_select: false, is_active: true };

function generateUid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildEmptyOption() {
  return { uid: generateUid("option"), text: "", pathwayWeights: [] };
}

function mapQuestionToLocalOptions(question) {
  return (question?.options || []).map((option) => ({
    uid: generateUid("option"),
    text: option.text || "",
    pathwayWeights: (option.pathway_weights || []).map((weight) => ({
      uid: generateUid("weight"),
      pathwayId: weight.pathway?.id ?? "",
      weight: String(weight.weight ?? 1),
    })),
  }));
}

export default function OnboardingQuestionFormModal({ isOpen, onClose, onSaved, question }) {
  const isEditMode = Boolean(question);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [options, setOptions] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [optionsError, setOptionsError] = useState("");

  const pathwaysQuery = useQuery({
    queryKey: ["pathways", "questionnairePicker"],
    queryFn: async () => {
      const response = await getAdminPathways({ pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });
  const pathwayOptions = (pathwaysQuery.data || []).map((pathway) => ({
    value: pathway.id,
    label: pathway.name,
  }));

  const createQuestionMutation = useMutation({
    mutationFn: (payload) => createQuestion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuestion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });

  const isSubmitting = createQuestionMutation.isPending || updateQuestionMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      text: question?.text || "",
      order: String(question?.order ?? 1),
      is_multi_select: Boolean(question?.is_multi_select),
      is_active: question ? Boolean(question.is_active) : true,
    });
    setOptions(isEditMode ? mapQuestionToLocalOptions(question) : [buildEmptyOption(), buildEmptyOption()]);
    setFieldErrors({});
    setOptionsError("");
  }, [isOpen, question, isEditMode]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const toggleField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.checked }));
  };

  const addOption = () => {
    setOptions((prev) => [...prev, buildEmptyOption()]);
    setOptionsError("");
  };

  const updateOption = (uid, nextOption) => {
    setOptions((prev) => prev.map((option) => (option.uid === uid ? nextOption : option)));
  };

  const removeOption = (uid) => {
    setOptions((prev) => prev.filter((option) => option.uid !== uid));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = form.text.trim();
    const order = Number(form.order);

    const errors = {};
    if (!text) errors.text = "Question text is required.";
    if (!Number.isFinite(order) || order < 1 || !Number.isInteger(order)) {
      errors.order = "Order must be 1, 2, 3... only.";
    }

    let optionsErrorMessage = "";
    if (options.length < 2) {
      optionsErrorMessage = "Provide at least two options for this question.";
    } else if (options.some((option) => !option.text.trim())) {
      optionsErrorMessage = "Every option needs text.";
    } else if (
      options.some((option) =>
        option.pathwayWeights.some((weight) => !weight.pathwayId || !weight.weight)
      )
    ) {
      optionsErrorMessage = "Every pathway weight row needs a pathway and a weight.";
    }

    if (Object.keys(errors).length > 0 || optionsErrorMessage) {
      setFieldErrors(errors);
      setOptionsError(optionsErrorMessage);
      return;
    }

    const payload = {
      text,
      order,
      is_multi_select: form.is_multi_select,
      is_active: form.is_active,
      options: options.map((option, index) => ({
        text: option.text.trim(),
        order: index + 1,
        pathway_weights: option.pathwayWeights.map((weight) => ({
          pathway: Number(weight.pathwayId),
          weight: Number(weight.weight),
        })),
      })),
    };

    try {
      const response = isEditMode
        ? await updateQuestionMutation.mutateAsync({ id: question.id, payload })
        : await createQuestionMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Question ${isEditMode ? "updated" : "created"} successfully.`);
      onSaved?.();
      handleClose();
    } catch (error) {
      const apiFieldErrors = error?.data?.data;
      if (apiFieldErrors && typeof apiFieldErrors === "object") {
        const mapped = {};
        Object.entries(apiFieldErrors).forEach(([key, value]) => {
          if (key === "options") {
            setOptionsError(Array.isArray(value) ? value[0] : String(value));
            return;
          }
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(mapped);
      }
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} question.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : HelpCircle}
      title={isEditMode ? "Edit Question" : "Add Question"}
      subtitle={isEditMode ? "Update the question and its options." : "Create a new questionnaire question."}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Question Text</label>
          <textarea
            value={form.text}
            onChange={updateField("text")}
            disabled={isSubmitting}
            placeholder="What are you hoping to learn?"
            rows={2}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.text && <p className={ERROR_CLASS}>{fieldErrors.text}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>Order</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.order}
              onChange={updateField("order")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            {fieldErrors.order && <p className={ERROR_CLASS}>{fieldErrors.order}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm font-mono text-stone-600 mt-6 sm:mt-0 sm:self-end sm:pb-3.5">
            <input
              type="checkbox"
              checked={form.is_multi_select}
              onChange={toggleField("is_multi_select")}
              disabled={isSubmitting}
            />
            Multi-select
          </label>

          <label className="flex items-center gap-2 text-sm font-mono text-stone-600 sm:self-end sm:pb-3.5">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={toggleField("is_active")}
              disabled={isSubmitting}
            />
            Active
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`${LABEL_CLASS} mb-0`}>Options</label>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <QuestionOptionRow
                key={option.uid}
                option={option}
                optionIndex={index}
                onChange={(nextOption) => updateOption(option.uid, nextOption)}
                onRemove={() => removeOption(option.uid)}
                pathwayOptions={pathwayOptions}
                isLoadingPathways={pathwaysQuery.isLoading}
                disabled={isSubmitting}
              />
            ))}
          </div>
          {optionsError && <p className={ERROR_CLASS}>{optionsError}</p>}

          <button
            type="button"
            onClick={addOption}
            disabled={isSubmitting}
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-xs font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Option
          </button>
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
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Update Question" : "Create Question"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
