"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Layers,
  ListPlus,
  Plus,
  Trash2,
  Video,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AddLessonModal from "@/components/features/admin/AddLessonModal";
import { createModule, deleteModule, getModules, updateModule } from "@/services/modulesService";
import { deleteLesson, getLessons } from "@/services/lessonsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = { title: "", description: "", order: "0" };

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS = "text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

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

function ModuleLessonsList({ moduleId, onAddLesson, onEditLesson, onDeleteLesson }) {
  const lessonsQuery = useQuery({
    queryKey: ["lessons", moduleId],
    queryFn: async () => {
      const response = await getLessons({ moduleId });
      return response?.data?.results || [];
    },
  });
  const lessons = lessonsQuery.data || [];

  if (lessonsQuery.isLoading) {
    return <Loader fullScreen={false} label="Loading lessons..." />;
  }

  return (
    <div className="space-y-2">
      {lessons.length > 0 && (
        <ul className="space-y-2">
          {lessons.map((lesson) => {
            const LessonIcon =
              lesson.content_type === "VIDEO" ? Video : lesson.content_type === "IMAGE" ? ImageIcon : FileText;
            return (
              <li
                key={lesson.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 bg-stone-50"
              >
                <span
                  className="text-stone-300 cursor-grab shrink-0"
                  title="Drag to reorder"
                  aria-hidden="true"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </span>
                <LessonIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-800 truncate">{lesson.title}</p>
                  <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-0.5">
                    {lesson.content_type} · {lesson.duration_minutes} min
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEditLesson(lesson)}
                  title="Edit lesson"
                  aria-label="Edit lesson"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition shrink-0 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteLesson({ id: lesson.id, title: lesson.title, moduleId })}
                  title="Delete lesson"
                  aria-label="Delete lesson"
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition shrink-0 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onAddLesson(moduleId)}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Add lesson to this module
      </button>
    </div>
  );
}

export default function ManageModulesModal({ isOpen, onClose, course }) {
  const courseId = course?.id;
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [deletingModule, setDeletingModule] = useState(null);
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [lessonModalState, setLessonModalState] = useState({ isOpen: false, moduleId: null, lesson: null });
  const [deletingLesson, setDeletingLesson] = useState(null);

  const modulesQuery = useQuery({
    queryKey: ["modules", courseId],
    queryFn: async () => {
      const response = await getModules({ courseId });
      return response?.data?.results || [];
    },
    enabled: isOpen && Boolean(courseId),
  });
  const modules = modulesQuery.data || [];

  useEffect(() => {
    if (!isOpen || !courseId) return;
    setIsFormOpen(false);
    setEditingModule(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setExpandedModuleId(null);
    setLessonModalState({ isOpen: false, moduleId: null, lesson: null });
  }, [isOpen, courseId]);

  const createModuleMutation = useMutation({
    mutationFn: (payload) => createModule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ id, payload }) => updateModule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (id) => deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lesson) => deleteLesson(lesson.id),
    onSuccess: (_data, lesson) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lesson.moduleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });

  const isSubmitting = createModuleMutation.isPending || updateModuleMutation.isPending;

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

  const toggleExpand = (moduleId) => {
    setExpandedModuleId((prev) => (prev === moduleId ? null : moduleId));
  };

  const openAddLesson = (moduleId) => {
    setLessonModalState({ isOpen: true, moduleId, lesson: null });
  };

  const openEditLesson = (lesson) => {
    setLessonModalState({ isOpen: true, moduleId: null, lesson });
  };

  const closeAddLesson = () => {
    setLessonModalState({ isOpen: false, moduleId: null, lesson: null });
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

    try {
      const response = editingModule
        ? await updateModuleMutation.mutateAsync({ id: editingModule.id, payload })
        : await createModuleMutation.mutateAsync(payload);
      toastSuccess(response?.message || `Module ${editingModule ? "updated" : "created"} successfully.`);
      setIsFormOpen(false);
      setEditingModule(null);
    } catch (error) {
      const mapped = extractFieldErrors(error);
      if (mapped) setFieldErrors(mapped);
      toastError(getApiErrorMessage(error, `Unable to ${editingModule ? "update" : "create"} module.`));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingModule) return;
    try {
      await deleteModuleMutation.mutateAsync(deletingModule.id);
      toastSuccess("Module deleted successfully.");
      setDeletingModule(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete module."));
    }
  };

  const handleDeleteLessonConfirm = async () => {
    if (!deletingLesson) return;
    try {
      await deleteLessonMutation.mutateAsync(deletingLesson);
      toastSuccess("Lesson deleted successfully.");
      setDeletingLesson(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete lesson."));
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
              className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-all flex items-center justify-center gap-2 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
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
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:scale-[1.01] transition-all flex items-center gap-2 cursor-pointer"
            >
              <ListPlus className="w-4 h-4" />
              Add Module
            </button>
          </div>

          {modulesQuery.isLoading ? (
            <Loader fullScreen={false} label="Loading modules..." />
          ) : modules.length === 0 ? (
            <EmptyState label="No modules found." />
          ) : (
            <ul className="space-y-3">
              {modules.map((module) => {
                const isExpanded = expandedModuleId === module.id;
                return (
                  <li
                    key={module.id}
                    className="rounded-2xl border border-stone-200 bg-stone-100/70 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 p-4">
                      <span
                        className="text-stone-300 cursor-grab shrink-0"
                        title="Drag to reorder"
                        aria-hidden="true"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleExpand(module.id)}
                        aria-label={isExpanded ? "Collapse module" : "Expand module"}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition shrink-0 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-lg font-bold text-stone-900 truncate">{module.title}</p>
                        <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-1">
                          Order {module.order} · {module.lessons_count} lesson
                          {module.lessons_count === 1 ? "" : "s"} · {module.total_duration_minutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => openAddLesson(module.id)}
                          className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-semibold font-mono rounded-xl tracking-wider border border-stone-200 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Lesson
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditForm(module)}
                          title="Edit module"
                          aria-label="Edit module"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingModule(module)}
                          title="Delete module"
                          aria-label="Delete module"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-stone-200 px-4 py-3">
                        <ModuleLessonsList
                          moduleId={module.id}
                          onAddLesson={openAddLesson}
                          onEditLesson={openEditLesson}
                          onDeleteLesson={setDeletingLesson}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deletingModule)}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteModuleMutation.isPending}
        title="Delete Module"
        message={`Are you sure you want to delete "${deletingModule?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        isOpen={Boolean(deletingLesson)}
        onClose={() => setDeletingLesson(null)}
        onConfirm={handleDeleteLessonConfirm}
        isConfirming={deleteLessonMutation.isPending}
        title="Delete Lesson"
        message={`Are you sure you want to delete "${deletingLesson?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <AddLessonModal
        isOpen={lessonModalState.isOpen}
        onClose={closeAddLesson}
        modules={modules}
        defaultModuleId={lessonModalState.moduleId}
        lesson={lessonModalState.lesson}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
        }}
      />
    </Modal>
  );
}
