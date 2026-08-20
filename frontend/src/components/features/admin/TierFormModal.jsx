"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, Layers3, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createTier, getTierById, updateTier } from "@/services/tiersService";
import { getCategories } from "@/services/categoriesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const INITIAL_FORM = {
  name: "",
  level: "1",
  audience: "",
  focus_description: "",
  status: "DRAFT",
  category: "",
  estimated_duration: "",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[10px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

function sanitizeIntegerInput(rawValue) {
  return rawValue.replace(/[^0-9]/g, "");
}

export default function TierFormModal({ isOpen, onClose, onSaved, tier }) {
  const isEditMode = Boolean(tier);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const tierDetailQuery = useQuery({
    queryKey: ["tier", tier?.id],
    queryFn: async () => {
      const response = await getTierById(tier.id);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(tier?.id),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await getCategories({ pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: isOpen,
  });
  const categories = categoriesQuery.data || [];

  const createTierMutation = useMutation({
    mutationFn: (payload) => createTier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
    },
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
      queryClient.invalidateQueries({ queryKey: ["tier", tier?.id] });
    },
  });

  const isSubmitting = createTierMutation.isPending || updateTierMutation.isPending;
  const isLoadingTier = isEditMode && tierDetailQuery.isLoading;
  const isBusy = isSubmitting || isLoadingTier;

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setFieldErrors({});
  }, [isOpen]);

  useEffect(() => {
    const detail = tierDetailQuery.data;
    if (!isOpen || !isEditMode || !detail) return;

    setForm({
      name: detail.name || "",
      level: String(detail.level ?? 1),
      audience: detail.audience || "",
      focus_description: detail.focus_description || "",
      status: detail.status || "DRAFT",
      category: detail.category?.id ? String(detail.category.id) : "",
      estimated_duration: detail.estimated_duration || "",
    });
  }, [isOpen, isEditMode, tierDetailQuery.data]);

  useEffect(() => {
    if (!isOpen || !tierDetailQuery.isError) return;
    toastError(getApiErrorMessage(tierDetailQuery.error, "Unable to load tier details."));
  }, [isOpen, tierDetailQuery.isError, tierDetailQuery.error]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleLevelChange = (event) => {
    setForm((prev) => ({ ...prev, level: sanitizeIntegerInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, level: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const level = Number(form.level);

    const errors = {};
    if (!name) errors.name = "Name is required.";
    if (!Number.isFinite(level) || level < 1) errors.level = "Level must be a positive number.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name,
      level,
      audience: form.audience.trim(),
      focus_description: form.focus_description.trim(),
      status: form.status,
      category: form.category ? Number(form.category) : null,
      estimated_duration: form.estimated_duration.trim(),
    };

    try {
      const response = isEditMode
        ? await updateTierMutation.mutateAsync({ id: tier.id, payload })
        : await createTierMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Tier ${isEditMode ? "updated" : "created"} successfully.`);
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
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} tier.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : Layers3}
      title={isEditMode ? "Edit Tier" : "Add Tier"}
      subtitle={isEditMode ? "Update the tier details." : "Create a new curriculum tier."}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Name</label>
          <input
            type="text"
            value={form.name}
            onChange={updateField("name")}
            disabled={isBusy}
            placeholder="e.g. The Blueprint"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.name && <p className={ERROR_CLASS}>{fieldErrors.name}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Audience</label>
          <input
            type="text"
            value={form.audience}
            onChange={updateField("audience")}
            disabled={isBusy}
            placeholder="e.g. 8th-10th Grade Athletes"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.audience && <p className={ERROR_CLASS}>{fieldErrors.audience}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Focus Description</label>
          <textarea
            value={form.focus_description}
            onChange={updateField("focus_description")}
            disabled={isBusy}
            placeholder="What this tier focuses on"
            rows={4}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.focus_description && <p className={ERROR_CLASS}>{fieldErrors.focus_description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Level</label>
            <input
              type="text"
              inputMode="numeric"
              value={form.level}
              onChange={handleLevelChange}
              disabled={isBusy}
              placeholder="1"
              className={FIELD_CLASS}
            />
            {fieldErrors.level && <p className={ERROR_CLASS}>{fieldErrors.level}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Status</label>
            <select
              value={form.status}
              onChange={updateField("status")}
              disabled={isBusy}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Category</label>
            <select
              value={form.category}
              onChange={updateField("category")}
              disabled={isBusy || categoriesQuery.isLoading}
              className={FIELD_CLASS}
            >
              <option value="">Uncategorized</option>
              {categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && <p className={ERROR_CLASS}>{fieldErrors.category}</p>}
          </div>

          <div>
            <label className={LABEL_CLASS}>Estimated Duration</label>
            <input
              type="text"
              value={form.estimated_duration}
              onChange={updateField("estimated_duration")}
              disabled={isBusy}
              placeholder="e.g. 12 Months"
              className={FIELD_CLASS}
              autoComplete="off"
            />
            {fieldErrors.estimated_duration && <p className={ERROR_CLASS}>{fieldErrors.estimated_duration}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isBusy}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Update Tier" : "Create Tier"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
