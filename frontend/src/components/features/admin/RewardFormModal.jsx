"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, Gift, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createReward, updateReward } from "@/services/rewardsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const REWARD_TYPE_OPTIONS = [
  { value: "MERCHANDISE", label: "Merchandise" },
  { value: "MENTORSHIP", label: "Mentorship" },
  { value: "DISCOUNT", label: "Discount" },
  { value: "EXPERIENCE", label: "Experience" },
  { value: "OTHER", label: "Other" },
];

const FULFILLMENT_TYPE_OPTIONS = [
  { value: "SCHEDULED_SESSION", label: "Scheduled Session" },
  { value: "EVENT_ACCESS", label: "Event Access" },
  { value: "DIGITAL_CODE", label: "Digital Code" },
  { value: "DIGITAL_ACCESS", label: "Digital Access" },
  { value: "PHYSICAL_DELIVERY", label: "Physical Delivery" },
  { value: "PROFILE_BADGE", label: "Profile Badge" },
  { value: "MANUAL_FULFILLMENT", label: "Manual Fulfillment" },
];

const SCHEDULABLE_FULFILLMENT_TYPES = new Set(["SCHEDULED_SESSION", "EVENT_ACCESS"]);

const INITIAL_FORM = {
  name: "",
  description: "",
  reward_type: "OTHER",
  fulfillment_type: "MANUAL_FULFILLMENT",
  duration_minutes: "",
  points_required: "",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function sanitizeIntegerInput(rawValue) {
  return rawValue.replace(/[^0-9]/g, "");
}

export default function RewardFormModal({ isOpen, onClose, onSaved, reward }) {
  const isEditMode = Boolean(reward);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const createRewardMutation = useMutation({
    mutationFn: (payload) => createReward(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-rewards"] }),
  });

  const updateRewardMutation = useMutation({
    mutationFn: ({ id, payload }) => updateReward(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-rewards"] }),
  });

  const isSubmitting = createRewardMutation.isPending || updateRewardMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setForm(
      reward
        ? {
            name: reward.name || "",
            description: reward.description || "",
            reward_type: reward.reward_type || "OTHER",
            fulfillment_type: reward.fulfillment_type || "MANUAL_FULFILLMENT",
            duration_minutes: reward.duration_minutes != null ? String(reward.duration_minutes) : "",
            points_required: String(reward.points_required ?? ""),
          }
        : INITIAL_FORM
    );
  }, [isOpen, reward]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePointsChange = (event) => {
    setForm((prev) => ({ ...prev, points_required: sanitizeIntegerInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, points_required: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const points = Number(form.points_required);
    const duration = form.duration_minutes ? Number(form.duration_minutes) : null;

    const errors = {};
    if (!name) errors.name = "Name is required.";
    if (!Number.isFinite(points) || points <= 0) {
      errors.points_required = "Points required must be greater than zero.";
    }
    if (form.duration_minutes && (!Number.isFinite(duration) || duration <= 0)) {
      errors.duration_minutes = "Duration must be greater than zero minutes.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name,
      description: form.description.trim(),
      reward_type: form.reward_type,
      fulfillment_type: form.fulfillment_type,
      duration_minutes: duration,
      points_required: points,
    };

    try {
      const response = isEditMode
        ? await updateRewardMutation.mutateAsync({ id: reward.id, payload })
        : await createRewardMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Reward ${isEditMode ? "updated" : "created"} successfully.`);
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
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} reward.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : Gift}
      title={isEditMode ? "Edit Reward" : "Add Reward"}
      subtitle={isEditMode ? "Update this reward's configuration." : "Add a new item to the rewards catalog."}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={updateField("name")}
            disabled={isSubmitting}
            placeholder="e.g. Mentor 1-on-1 Session"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.name && <p className={ERROR_CLASS}>{fieldErrors.name}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isSubmitting}
            placeholder="What the student receives"
            rows={4}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Type</label>
            <select
              value={form.reward_type}
              onChange={updateField("reward_type")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {REWARD_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.reward_type && <p className={ERROR_CLASS}>{fieldErrors.reward_type}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Points Required</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.points_required}
              onChange={handlePointsChange}
              disabled={isSubmitting}
              placeholder="500"
              className={FIELD_CLASS}
            />
            {fieldErrors.points_required && <p className={ERROR_CLASS}>{fieldErrors.points_required}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Fulfillment Type</label>
            <select
              value={form.fulfillment_type}
              onChange={updateField("fulfillment_type")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            >
              {FULFILLMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.fulfillment_type && <p className={ERROR_CLASS}>{fieldErrors.fulfillment_type}</p>}
          </div>

          {SCHEDULABLE_FULFILLMENT_TYPES.has(form.fulfillment_type) && (
            <div>
              <label className={LABEL_CLASS}>Duration (minutes)</label>
              <input
                type="text"
                inputMode="numeric"
                value={form.duration_minutes}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, duration_minutes: sanitizeIntegerInput(event.target.value) }));
                  setFieldErrors((prev) => ({ ...prev, duration_minutes: null }));
                }}
                disabled={isSubmitting}
                placeholder="30"
                className={FIELD_CLASS}
              />
              {fieldErrors.duration_minutes && <p className={ERROR_CLASS}>{fieldErrors.duration_minutes}</p>}
            </div>
          )}
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
                {isEditMode ? "Update Reward" : "Create Reward"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
