"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Edit3, Route, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createPathway, getPathwayById, updatePathway } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

const INITIAL_FORM = {
  name: "",
  summary: "",
  description: "",
  base_price: "0",
  status: "DRAFT",
};

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

function sanitizeAmountInput(rawValue) {
  const digitsAndDot = rawValue.replace(/[^0-9.]/g, "");
  const [integerPart, ...decimalParts] = digitsAndDot.split(".");
  if (decimalParts.length === 0) return integerPart;
  return `${integerPart}.${decimalParts.join("").slice(0, 2)}`;
}

export default function PathwayFormModal({ isOpen, onClose, onSaved, pathway }) {
  const isEditMode = Boolean(pathway);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const pathwayDetailQuery = useQuery({
    queryKey: ["pathway", pathway?.id],
    queryFn: async () => {
      const response = await getPathwayById(pathway.id);
      return response?.data || null;
    },
    enabled: isOpen && Boolean(pathway?.id),
  });

  const createPathwayMutation = useMutation({
    mutationFn: (payload) => createPathway(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
    },
  });

  const updatePathwayMutation = useMutation({
    mutationFn: ({ id, payload }) => updatePathway(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pathways"] });
      queryClient.invalidateQueries({ queryKey: ["pathway", pathway?.id] });
    },
  });

  const isSubmitting = createPathwayMutation.isPending || updatePathwayMutation.isPending;
  const isLoadingPathway = isEditMode && pathwayDetailQuery.isLoading;
  const isBusy = isSubmitting || isLoadingPathway;

  useEffect(() => {
    if (!isOpen) return;
    setForm(INITIAL_FORM);
    setFieldErrors({});
  }, [isOpen]);

  useEffect(() => {
    const detail = pathwayDetailQuery.data;
    if (!isOpen || !isEditMode || !detail) return;

    setForm({
      name: detail.name || "",
      summary: detail.summary || "",
      description: detail.description || "",
      base_price: String(detail.base_price ?? 0),
      status: detail.status || "DRAFT",
    });
  }, [isOpen, isEditMode, pathwayDetailQuery.data]);

  useEffect(() => {
    if (!isOpen || !pathwayDetailQuery.isError) return;
    toastError(getApiErrorMessage(pathwayDetailQuery.error, "Unable to load pathway details."));
  }, [isOpen, pathwayDetailQuery.isError, pathwayDetailQuery.error]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleAmountChange = (event) => {
    setForm((prev) => ({ ...prev, base_price: sanitizeAmountInput(event.target.value) }));
    setFieldErrors((prev) => ({ ...prev, base_price: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const summary = form.summary.trim();
    const basePrice = Number(form.base_price);

    const errors = {};
    if (!name) errors.name = "Name is required.";
    if (!summary) errors.summary = "Summary is required.";
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      errors.base_price = "Base price must be a positive number.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      name,
      summary,
      description: form.description.trim(),
      base_price: basePrice,
      status: form.status,
    };

    try {
      const response = isEditMode
        ? await updatePathwayMutation.mutateAsync({ id: pathway.id, payload })
        : await createPathwayMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Pathway ${isEditMode ? "updated" : "created"} successfully.`);
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
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} pathway.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={isEditMode ? Edit3 : Route}
      title={isEditMode ? "Edit Pathway" : "Add Pathway"}
      subtitle={isEditMode ? "Update the pathway details." : "Create a new pathway."}
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
            placeholder="Pathway name"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.name && <p className={ERROR_CLASS}>{fieldErrors.name}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Summary</label>
          <input
            type="text"
            value={form.summary}
            onChange={updateField("summary")}
            disabled={isBusy}
            placeholder="Short one-line summary"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.summary && <p className={ERROR_CLASS}>{fieldErrors.summary}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isBusy}
            placeholder="Full pathway description"
            rows={4}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Base Price ($)</label>
            <input
              type="text"
              inputMode="decimal"
              value={form.base_price}
              onChange={handleAmountChange}
              disabled={isBusy}
              placeholder="0.00"
              className={FIELD_CLASS}
            />
            {fieldErrors.base_price && <p className={ERROR_CLASS}>{fieldErrors.base_price}</p>}
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

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isBusy}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isBusy}
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
                {isEditMode ? "Update Pathway" : "Create Pathway"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
