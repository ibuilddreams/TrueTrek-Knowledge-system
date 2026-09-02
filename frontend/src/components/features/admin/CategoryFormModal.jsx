"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, FolderPlus, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createCategory, updateCategory } from "@/services/categoriesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "text-muted font-sans uppercase tracking-widest text-xs font-medium block mb-1.5";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export default function CategoryFormModal({ isOpen, onClose, onSaved, category }) {
  const isEditMode = Boolean(category);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState("");

  const createCategoryMutation = useMutation({
    mutationFn: (payload) => createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const isSubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setName(category?.name || "");
    setFieldError("");
  }, [isOpen, category]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldError("Category name is required.");
      return;
    }

    try {
      const response = isEditMode
        ? await updateCategoryMutation.mutateAsync({ id: category.id, payload: { name: trimmedName } })
        : await createCategoryMutation.mutateAsync({ name: trimmedName });
      toastSuccess(
        response?.message ||
          (isEditMode ? "Category updated successfully." : "Category created successfully.")
      );
      onSaved?.();
      handleClose();
    } catch (error) {
      const fieldErrors = error?.data?.data;
      if (fieldErrors && Array.isArray(fieldErrors.name)) {
        setFieldError(fieldErrors.name[0]);
      } else {
        toastError(
          getApiErrorMessage(error, isEditMode ? "Unable to update category." : "Unable to create category.")
        );
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={FolderPlus}
      title={isEditMode ? "Edit Category" : "Add Category"}
      subtitle={isEditMode ? category?.name : "Create a new course category."}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Category Name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setFieldError("");
            }}
            disabled={isSubmitting}
            placeholder="e.g. Web Development"
            className={FIELD_CLASS}
            autoComplete="off"
            autoFocus
          />
          {fieldError && <p className={ERROR_CLASS}>{fieldError}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-porcelain text-ink text-sm font-semibold font-mono rounded-full tracking-wider transition-all flex items-center justify-center gap-2 border border-line shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper text-sm font-semibold font-mono rounded-full tracking-wider uppercase transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Save Changes" : "Create Category"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
