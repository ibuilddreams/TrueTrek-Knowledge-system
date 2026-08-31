"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Tag as TagIcon, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createTag, updateTag } from "@/services/tagsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

export default function TagFormModal({ isOpen, onClose, onSaved, tag }) {
  const isEditMode = Boolean(tag);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState("");

  const createTagMutation = useMutation({
    mutationFn: (payload) => createTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, payload }) => updateTag(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });

  const isSubmitting = createTagMutation.isPending || updateTagMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    setName(tag?.name || "");
    setFieldError("");
  }, [isOpen, tag]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldError("Tag name is required.");
      return;
    }

    try {
      const response = isEditMode
        ? await updateTagMutation.mutateAsync({ id: tag.id, payload: { name: trimmedName } })
        : await createTagMutation.mutateAsync({ name: trimmedName });
      toastSuccess(
        response?.message || (isEditMode ? "Tag updated successfully." : "Tag created successfully.")
      );
      onSaved?.();
      handleClose();
    } catch (error) {
      const fieldErrors = error?.data?.data;
      if (fieldErrors && Array.isArray(fieldErrors.name)) {
        setFieldError(fieldErrors.name[0]);
      } else {
        toastError(
          getApiErrorMessage(error, isEditMode ? "Unable to update tag." : "Unable to create tag.")
        );
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={TagIcon}
      title={isEditMode ? "Edit Tag" : "Add Tag"}
      subtitle={isEditMode ? tag?.name : "Create a new course tag."}
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Tag Name</label>
          <input
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setFieldError("");
            }}
            disabled={isSubmitting}
            placeholder="e.g. Beginner Friendly"
            className={FIELD_CLASS}
            autoComplete="off"
            autoFocus
          />
          {fieldError && <p className={ERROR_CLASS}>{fieldError}</p>}
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
                {isEditMode ? "Save Changes" : "Create Tag"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
