"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, Swords, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createQuest, updateQuest } from "@/services/questsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

// Mirrors quests.models.Quest.Category / .Difficulty.
const CATEGORY_OPTIONS = [
  { value: "AUDIT", label: "Brand Audit" },
  { value: "CONTENT", label: "Content Creation" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "PROFILE", label: "Profile Optimization" },
  { value: "OUTREACH", label: "Outreach & Networking" },
  { value: "REFLECTION", label: "Reflection" },
];

const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Easy" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HARD", label: "Hard" },
];

const STATUS_OPTIONS = [
  { value: "PUBLISHED", label: "Published" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

const INITIAL_FORM = {
  title: "",
  instructions: "",
  category: "CONTENT",
  difficulty: "EASY",
  points_reward: "10",
  estimated_minutes: "10",
  proof_hint: "",
  status: "PUBLISHED",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "text-xs font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function sanitizeIntegerInput(rawValue) {
  return rawValue.replace(/[^0-9]/g, "");
}

export default function QuestFormModal({ isOpen, onClose, onSaved, quest }) {
  const isEditMode = Boolean(quest);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const createQuestMutation = useMutation({
    mutationFn: (payload) => createQuest(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-quests"] }),
  });

  const updateQuestMutation = useMutation({
    mutationFn: ({ id, payload }) => updateQuest(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-quests"] }),
  });

  const isSubmitting = createQuestMutation.isPending || updateQuestMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setForm(
      quest
        ? {
            title: quest.title || "",
            instructions: quest.instructions || "",
            category: quest.category || "CONTENT",
            difficulty: quest.difficulty || "EASY",
            points_reward: String(quest.points_reward ?? ""),
            estimated_minutes: String(quest.estimated_minutes ?? ""),
            proof_hint: quest.proof_hint || "",
            status: quest.status || "PUBLISHED",
          }
        : INITIAL_FORM,
    );
  }, [isOpen, quest]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateIntegerField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: sanitizeIntegerInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const instructions = form.instructions.trim();
    const points = Number(form.points_reward);
    const minutes = Number(form.estimated_minutes);

    const errors = {};
    if (!title) errors.title = "Title is required.";
    if (!instructions) errors.instructions = "Instructions are required.";
    if (!Number.isFinite(points) || points < 1) {
      errors.points_reward = "A quest must be worth at least 1 point.";
    }
    if (!Number.isFinite(minutes) || minutes < 1) {
      errors.estimated_minutes = "Estimated time must be at least 1 minute.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      title,
      instructions,
      category: form.category,
      difficulty: form.difficulty,
      points_reward: points,
      estimated_minutes: minutes,
      proof_hint: form.proof_hint.trim(),
      status: form.status,
    };

    try {
      const response = isEditMode
        ? await updateQuestMutation.mutateAsync({ id: quest.id, payload })
        : await createQuestMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Quest ${isEditMode ? "updated" : "created"} successfully.`);
      onSaved?.();
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
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} quest.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : Swords}
      title={isEditMode ? "Edit Quest" : "Add Quest"}
      subtitle={
        isEditMode
          ? "Update this quest's wording and reward."
          : "Add a real-world task students can be assigned."
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            disabled={isSubmitting}
            placeholder="e.g. Delete three off-brand posts"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Instructions</label>
          <textarea
            value={form.instructions}
            onChange={updateField("instructions")}
            disabled={isSubmitting}
            placeholder="Exactly what the athlete should go and do today."
            rows={4}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.instructions && <p className={ERROR_CLASS}>{fieldErrors.instructions}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            {fieldErrors.category && <p className={ERROR_CLASS}>{fieldErrors.category}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Difficulty</label>
            <select
              value={form.difficulty}
              onChange={updateField("difficulty")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.difficulty && <p className={ERROR_CLASS}>{fieldErrors.difficulty}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL_CLASS}>Points Reward</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.points_reward}
              onChange={updateIntegerField("points_reward")}
              disabled={isSubmitting}
              placeholder="10"
              className={FIELD_CLASS}
            />
            {fieldErrors.points_reward && <p className={ERROR_CLASS}>{fieldErrors.points_reward}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Est. Minutes</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.estimated_minutes}
              onChange={updateIntegerField("estimated_minutes")}
              disabled={isSubmitting}
              placeholder="10"
              className={FIELD_CLASS}
            />
            {fieldErrors.estimated_minutes && (
              <p className={ERROR_CLASS}>{fieldErrors.estimated_minutes}</p>
            )}
          </div>

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
        </div>

        <div>
          <label className={LABEL_CLASS}>Proof Hint (optional)</label>
          <input
            type="text"
            value={form.proof_hint}
            onChange={updateField("proof_hint")}
            disabled={isSubmitting}
            placeholder="e.g. Attach a screenshot of your updated bio"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          <p className="text-[11px] font-light text-muted mt-1.5">
            Shown above the (always optional) proof upload on the student&apos;s quest card.
          </p>
          {fieldErrors.proof_hint && <p className={ERROR_CLASS}>{fieldErrors.proof_hint}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-porcelain text-ink text-sm font-semibold font-mono rounded-full tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-line shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper text-sm font-semibold font-mono rounded-full tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Update Quest" : "Create Quest"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
