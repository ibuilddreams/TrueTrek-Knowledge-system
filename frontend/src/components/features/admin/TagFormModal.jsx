"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Tag as TagIcon, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createTag, updateTag } from "@/services/tagsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const FIELD_CLASS =
  "w-full px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent focus:outline-none rounded-cn-p-sm text-sm text-cn-p-ink placeholder:text-cn-p-muted transition disabled:opacity-60";

const LABEL_CLASS =
  "block mb-1.5 text-[13px] font-semibold text-cn-p-ink";

const ERROR_CLASS = "text-[11px] text-cn-p-bad mt-1";

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
    <Modal variant="cobalt"
      isOpen={isOpen}
      onClose={handleClose}
      icon={TagIcon}
      title={isEditMode ? "Edit tag" : "Add tag"}
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

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-cn-p-line">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-transparent hover:bg-cn-p-page text-cn-p-ink text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2 border border-cn-p-line disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-cn-p-sm transition-all flex items-center justify-center gap-2"
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
