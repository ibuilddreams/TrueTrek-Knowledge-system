"use client";

import { useEffect, useState } from "react";
import { Check, Edit3, FilePlus2, Layers, ListPlus, Trash2, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddLessonModal from "@/components/features/admin/AddLessonModal";
import { createModule, deleteModule, getModules, updateModule } from "@/services/modulesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = { title: "", description: "", order: "0" };

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS = "text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

export default function ManageModulesModal({ isOpen, onClose, course }) {
  const courseId = course?.id;

  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingModule, setDeletingModule] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

  const loadModules = async () => {
    if (!courseId) return;
    setIsLoading(true);
    try {
      const response = await getModules({ courseId });
      setModules(response?.data?.results || []);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to load modules."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !courseId) return;
    setIsFormOpen(false);
    setEditingModule(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setIsLessonModalOpen(false);
    loadModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, courseId]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const openCreateForm = () => {
    setEditingModule(null);
    setForm({ ...INITIAL_FORM, order: String(modules.length) });
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (module) => {
    setEditingModule(module);
    setForm({
      title: module.title || "",
      description: module.description || "",
      order: String(module.order ?? 0),
    });
    setFieldErrors({});
    setIsFormOpen(true);
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
    if (!Number.isFinite(order) || order < 0) errors.order = "Order must be a positive number.";

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

    setIsSubmitting(true);
    try {
      const response = editingModule
        ? await updateModule(editingModule.id, payload)
        : await createModule(payload);
      toastSuccess(response?.message || `Module ${editingModule ? "updated" : "created"} successfully.`);
      setIsFormOpen(false);
      setEditingModule(null);
      loadModules();
    } catch (error) {
      const apiFieldErrors = error?.data?.data;
      if (apiFieldErrors && typeof apiFieldErrors === "object") {
        const mapped = {};
        Object.entries(apiFieldErrors).forEach(([key, value]) => {
          mapped[key] = Array.isArray(value) ? value[0] : String(value);
        });
        setFieldErrors(mapped);
      }
      toastError(getApiErrorMessage(error, `Unable to ${editingModule ? "update" : "create"} module.`));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingModule) return;
    setIsDeleting(true);
    try {
      await deleteModule(deletingModule.id);
      toastSuccess("Module deleted successfully.");
      setDeletingModule(null);
      loadModules();
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete module."));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={Layers}
      title="Course Modules"
      subtitle={course?.title ? `Manage Modules — ${course.title}` : "Manage Modules"}
      maxWidth="max-w-2xl"
    >
      {isFormOpen ? (
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
              min="0"
              value={form.order}
              onChange={updateField("order")}
              disabled={isSubmitting}
              className={FIELD_CLASS}
            />
            {fieldErrors.order && <p className={ERROR_CLASS}>{fieldErrors.order}</p>}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingModule(null);
              }}
              disabled={isSubmitting}
              className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {editingModule ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  {editingModule ? "Update Module" : "Create Module"}
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsLessonModalOpen(true)}
              disabled={modules.length === 0}
              className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:scale-[1.01] transition-all flex items-center gap-2"
            >
              <FilePlus2 className="w-4 h-4" />
              Add Lesson
            </button>
            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:scale-[1.01] transition-all flex items-center gap-2"
            >
              <ListPlus className="w-4 h-4" />
              Add Module
            </button>
          </div>

          {isLoading ? (
            <Loader fullScreen={false} label="Loading modules..." />
          ) : modules.length === 0 ? (
            <EmptyState label="No modules found." />
          ) : (
            <ul className="space-y-2">
              {modules.map((module) => (
                <li
                  key={module.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border border-stone-100 bg-stone-50/60"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-800 truncate">{module.title}</p>
                    <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-1">
                      Order {module.order} · {module.lessons_count} lesson
                      {module.lessons_count === 1 ? "" : "s"} · {module.total_duration_minutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(module)}
                      title="Edit module"
                      aria-label="Edit module"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-100 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingModule(module)}
                      title="Delete module"
                      aria-label="Delete module"
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingModule)}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={isDeleting}
        title="Delete Module"
        message={`Are you sure you want to delete "${deletingModule?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <AddLessonModal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        modules={modules}
        onCreated={loadModules}
      />
    </Modal>
  );
}
