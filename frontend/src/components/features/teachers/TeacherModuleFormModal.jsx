"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Layers, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { createModule, updateModule } from "@/services/modulesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = { title: "", description: "", order: "1" };

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS =
  "text-[11px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[11px] font-mono text-red-600 mt-1";

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

export default function TeacherModuleFormModal({
  isOpen,
  onClose,
  courseId,
  editingModule,
  nextOrder = 1,
  onSaved,
}) {
  const isEditMode = Boolean(editingModule);
  const queryClient = useQueryClient();

  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});

  const createModuleMutation = useMutation({
    mutationFn: (payload) => createModule(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modules", courseId] }),
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, payload }) => updateModule(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modules", courseId] }),
  });

  const isSubmitting = createModuleMutation.isPending || updateModuleMutation.isPending;

  useEffect(() => {
    if (!isOpen) return;
    if (editingModule) {
      setForm({
        title: editingModule.title || "",
        description: editingModule.description || "",
        order: String(editingModule.order ?? 1),
      });
    } else {
      setForm({ ...INITIAL_FORM, order: String(Math.max(1, nextOrder)) });
    }
    setFieldErrors({});
  }, [isOpen, editingModule, nextOrder]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const title = form.title.trim();
    const order = Number(form.order);

    const errors = {};
    if (!title) errors.title = "Title is required.";
    if (title.length > 255) errors.title = "Title must be at most 255 characters.";
    if (!Number.isFinite(order) || order < 1 || !Number.isInteger(order)) {
      errors.order = "Order must be 1, 2, 3... only.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const payload = {
      course: courseId,
      title,
      description: form.description.trim(),
      order,
    };

    try {
      const response = isEditMode
        ? await updateModuleMutation.mutateAsync({ id: editingModule.id, payload })
        : await createModuleMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Module ${isEditMode ? "updated" : "created"} successfully.`);
      onSaved?.(response?.data);
      onClose();
    } catch (error) {
      const mapped = extractFieldErrors(error);
      if (mapped) setFieldErrors(mapped);
      toastError(getApiErrorMessage(error, `Unable to ${isEditMode ? "update" : "create"} module.`));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Layers}
      title={isEditMode ? "Edit Module" : "Add Module"}
      subtitle={isEditMode ? editingModule?.title : "Create a new module for this course"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLASS}>Module Title</label>
          <input
            type="text"
            value={form.title}
            onChange={updateField("title")}
            disabled={isSubmitting}
            placeholder="Module title"
            className={FIELD_CLASS}
            autoComplete="off"
          />
          {fieldErrors.title && <p className={ERROR_CLASS}>{fieldErrors.title}</p>}
        </div>

        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            value={form.description}
            onChange={updateField("description")}
            disabled={isSubmitting}
            placeholder="Module description"
            rows={3}
            className={`${FIELD_CLASS} resize-none`}
          />
          {fieldErrors.description && <p className={ERROR_CLASS}>{fieldErrors.description}</p>}
        </div>

        <div className="w-32">
          <label className={LABEL_CLASS}>Order</label>
          <input
            type="number"
            min="1"
            step="1"
            value={form.order}
            onChange={updateField("order")}
            onKeyDown={(event) => {
              if (event.key === "-" || event.key === "e" || event.key === "E" || event.key === "+") {
                event.preventDefault();
              }
            }}
            disabled={isSubmitting}
            className={FIELD_CLASS}
          />
          <p className="mt-1.5 text-[11px] font-mono text-stone-400">1 = first position</p>
          {fieldErrors.order && <p className={ERROR_CLASS}>{fieldErrors.order}</p>}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditMode ? "Update Module" : "Create Module"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
