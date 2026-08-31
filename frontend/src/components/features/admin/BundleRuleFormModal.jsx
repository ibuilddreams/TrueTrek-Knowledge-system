"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Percent, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createBundleRule, updateBundleRule } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export default function BundleRuleFormModal({ isOpen, onClose, onSaved, rule }) {
  const isEditMode = Boolean(rule);
  const queryClient = useQueryClient();

  const [pathwayCount, setPathwayCount] = useState("2");
  const [discountPercent, setDiscountPercent] = useState("0");
  const [fieldErrors, setFieldErrors] = useState({});

  const createRuleMutation = useMutation({
    mutationFn: (payload) => createBundleRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundleRules"] });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, payload }) => updateBundleRule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundleRules"] });
    },
  });

  const isSubmitting = createRuleMutation.isPending || updateRuleMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setPathwayCount(String(rule?.pathway_count ?? 2));
    setDiscountPercent(String(rule?.discount_percent ?? 0));
    setFieldErrors({});
  }, [isOpen, rule]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const count = Number(pathwayCount);
    const percent = Number(discountPercent);

    const errors = {};
    if (!Number.isFinite(count) || !Number.isInteger(count) || count < 2) {
      errors.pathway_count = "Pathway count must be an integer of 2 or more.";
    }
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      errors.discount_percent = "Discount percent must be between 0 and 100.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = { pathway_count: count, discount_percent: percent };

    try {
      const response = isEditMode
        ? await updateRuleMutation.mutateAsync({ id: rule.id, payload })
        : await createRuleMutation.mutateAsync(payload);
      toastSuccess(
        response?.message ||
          (isEditMode ? "Bundle rule updated successfully." : "Bundle rule created successfully.")
      );
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
      toastError(
        getApiErrorMessage(error, isEditMode ? "Unable to update bundle rule." : "Unable to create bundle rule.")
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Percent}
      title={isEditMode ? "Edit Bundle Rule" : "Add Bundle Rule"}
      subtitle="Set a discount for bundling multiple pathways."
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Pathway Count</label>
          <input
            type="number"
            min="2"
            step="1"
            value={pathwayCount}
            onChange={(event) => {
              setPathwayCount(event.target.value);
              setFieldErrors((prev) => ({ ...prev, pathway_count: null }));
            }}
            disabled={isSubmitting}
            placeholder="2"
            className={FIELD_CLASS}
          />
          <p className="mt-1.5 text-[11px] font-mono text-stone-400">
            Number of pathways a student must bundle to earn this discount.
          </p>
          {fieldErrors.pathway_count && <p className={ERROR_CLASS}>{fieldErrors.pathway_count}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Discount Percent</label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={discountPercent}
            onChange={(event) => {
              setDiscountPercent(event.target.value);
              setFieldErrors((prev) => ({ ...prev, discount_percent: null }));
            }}
            disabled={isSubmitting}
            placeholder="0"
            className={FIELD_CLASS}
          />
          {fieldErrors.discount_percent && <p className={ERROR_CLASS}>{fieldErrors.discount_percent}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Save Changes" : "Create Rule"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
