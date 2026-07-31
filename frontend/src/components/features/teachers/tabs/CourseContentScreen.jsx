"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  ClipboardCheck,
  HelpCircle,
  Layers,
  ListPlus,
  Maximize2,
  Minimize2,
  MoveVertical,
  PlayCircle,
} from "lucide-react";
import { deleteModule, getModules, reorderModules } from "@/services/modulesService";
import { deleteLesson } from "@/services/lessonsService";
import { deleteAssignment } from "@/services/assignmentsService";
import { deleteQuiz } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import TeacherModuleRow from "@/components/features/teachers/TeacherModuleRow";
import TeacherModuleFormModal from "@/components/features/teachers/TeacherModuleFormModal";
import TeacherLessonFormModal from "@/components/features/teachers/TeacherLessonFormModal";
import TeacherAssignmentFormModal from "@/components/features/teachers/TeacherAssignmentFormModal";
import TeacherQuizFormModal from "@/components/features/teachers/TeacherQuizFormModal";

export default function CourseContentScreen({ courseId, course, onBack }) {
  const numericCourseId = Number(courseId);
  const queryClient = useQueryClient();

  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deletingModule, setDeletingModule] = useState(null);
  const [expandedModuleIds, setExpandedModuleIds] = useState(new Set());
  const [lessonModalState, setLessonModalState] = useState({ isOpen: false, moduleId: null, lesson: null });
  const [deletingLesson, setDeletingLesson] = useState(null);
  const [assignmentModalState, setAssignmentModalState] = useState({
    isOpen: false,
    moduleId: null,
    assignment: null,
  });
  const [deletingAssignment, setDeletingAssignment] = useState(null);
  const [quizModalState, setQuizModalState] = useState({ isOpen: false, moduleId: null, quiz: null });
  const [deletingQuiz, setDeletingQuiz] = useState(null);
  const [localModuleOrderIds, setLocalModuleOrderIds] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const modulesQuery = useQuery({
    queryKey: ["modules", numericCourseId],
    queryFn: async () => {
      const response = await getModules({ courseId: numericCourseId });
      return response?.data?.results || [];
    },
    enabled: Boolean(numericCourseId),
  });
  const modules = modulesQuery.data || [];

  const deleteModuleMutation = useMutation({
    mutationFn: (id) => deleteModule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modules", numericCourseId] }),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lesson) => deleteLesson(lesson.id),
    onSuccess: (_data, lesson) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lesson.moduleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", numericCourseId] });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignment) => deleteAssignment(assignment.id),
    onSuccess: (_data, assignment) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", assignment.moduleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", numericCourseId] });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quiz) => deleteQuiz(quiz.id),
    onSuccess: (_data, quiz) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", quiz.moduleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", numericCourseId] });
    },
  });

  const reorderModulesMutation = useMutation({
    mutationFn: (entries) => reorderModules(numericCourseId, entries),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["modules", numericCourseId] }),
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to reorder modules."));
    },
  });

  const displayModules = useMemo(() => {
    if (!localModuleOrderIds) return modules;
    const currentIds = modules.map((module) => module.id);
    const sameSet =
      localModuleOrderIds.length === currentIds.length &&
      localModuleOrderIds.every((id) => currentIds.includes(id));
    if (!sameSet) return modules;
    const moduleById = new Map(modules.map((module) => [module.id, module]));
    return localModuleOrderIds.map((id) => moduleById.get(id));
  }, [modules, localModuleOrderIds]);

  const totalLessons = useMemo(
    () => modules.reduce((sum, module) => sum + (module.lessons_count || 0), 0),
    [modules],
  );

  const totalAssignments = useMemo(
    () => modules.reduce((sum, module) => sum + (module.assignments_count || 0), 0),
    [modules],
  );

  const totalQuizzes = useMemo(
    () => modules.reduce((sum, module) => sum + (module.quizzes_count || 0), 0),
    [modules],
  );

  const areAllExpanded = modules.length > 0 && modules.every((module) => expandedModuleIds.has(module.id));

  const openCreateModuleForm = () => {
    setEditingModule(null);
    setIsModuleFormOpen(true);
  };

  const openEditModuleForm = (module) => {
    setEditingModule(module);
    setIsModuleFormOpen(true);
  };

  const closeModuleForm = () => {
    setIsModuleFormOpen(false);
    setEditingModule(null);
  };

  const toggleExpand = (moduleId) => {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    setExpandedModuleIds(areAllExpanded ? new Set() : new Set(modules.map((module) => module.id)));
  };

  const handleModuleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = displayModules.map((module) => module.id);
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderIds = arrayMove(currentIds, oldIndex, newIndex);
    setLocalModuleOrderIds(newOrderIds);

    const payload = newOrderIds.map((id, index) => ({ module_id: id, order: index + 1 }));
    reorderModulesMutation.mutate(payload);
  };

  const openAddLesson = (moduleId) => {
    setLessonModalState({ isOpen: true, moduleId, lesson: null });
  };

  const openEditLesson = (lesson) => {
    setLessonModalState({ isOpen: true, moduleId: null, lesson });
  };

  const closeLessonModal = () => {
    setLessonModalState({ isOpen: false, moduleId: null, lesson: null });
  };

  const openAddAssignment = (moduleId) => {
    setAssignmentModalState({ isOpen: true, moduleId, assignment: null });
  };

  const openEditAssignment = (assignment) => {
    setAssignmentModalState({ isOpen: true, moduleId: null, assignment });
  };

  const closeAssignmentModal = () => {
    setAssignmentModalState({ isOpen: false, moduleId: null, assignment: null });
  };

  const openAddQuiz = (moduleId) => {
    setQuizModalState({ isOpen: true, moduleId, quiz: null });
  };

  const openEditQuiz = (quiz) => {
    setQuizModalState({ isOpen: true, moduleId: null, quiz });
  };

  const closeQuizModal = () => {
    setQuizModalState({ isOpen: false, moduleId: null, quiz: null });
  };

  const handleDeleteModuleConfirm = async () => {
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

  const handleDeleteAssignmentConfirm = async () => {
    if (!deletingAssignment) return;
    try {
      await deleteAssignmentMutation.mutateAsync(deletingAssignment);
      toastSuccess("Assignment deleted successfully.");
      setDeletingAssignment(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete assignment."));
    }
  };

  const handleDeleteQuizConfirm = async () => {
    if (!deletingQuiz) return;
    try {
      await deleteQuizMutation.mutateAsync(deletingQuiz);
      toastSuccess("Quiz deleted successfully.");
      setDeletingQuiz(null);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to delete quiz."));
    }
  };

  const stats = [
    { key: "modules", label: "Modules", icon: Layers, value: modules.length },
    { key: "lessons", label: "Lessons", icon: PlayCircle, value: totalLessons },
    { key: "assignments", label: "Assignments", icon: ClipboardCheck, value: totalAssignments },
    { key: "quizzes", label: "Quizzes", icon: HelpCircle, value: totalQuizzes },
  ];

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-stone-500 hover:text-amber-700 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Courses
      </button>

      <div className="relative bg-white border border-stone-200/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800 opacity-80" />
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-amber-600 font-mono text-[10px] uppercase tracking-widest font-bold block mb-1">
                Course Content
              </span>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl font-serif font-black text-stone-900 truncate">
                  {course?.title || "Course"}
                </h2>
                {course?.status && <StatusBadge status={course.status} />}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={openCreateModuleForm}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <ListPlus className="w-4 h-4" />
            NEW MODULE
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-stone-100 border-t border-stone-100">
          {stats.map((stat) => (
            <div key={stat.key} className="flex items-center gap-3 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-serif font-bold text-stone-900">{stat.value}</p>
                <p className="text-[9px] font-mono uppercase tracking-widest text-stone-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">Modules</h3>
            <p className="text-xs text-stone-400 font-light">
              {modules.length} module{modules.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400">
              <MoveVertical className="w-3.5 h-3.5" />
              Drag the handle to reorder
            </span>
            {modules.length > 0 && (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-semibold font-mono rounded-xl tracking-wider border border-stone-200 shadow-sm transition-all cursor-pointer"
              >
                {areAllExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {areAllExpanded ? "Collapse All" : "Expand All"}
              </button>
            )}
          </div>
        </div>

        {modulesQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-3" aria-busy="true" aria-label="Loading modules">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-20 rounded-2xl bg-stone-100 animate-pulse" />
            ))}
          </div>
        ) : modules.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
            <EmptyState
              icon={Layers}
              label="No modules yet."
              description="Create your first module to start organizing this course's content."
            />
          </div>
        ) : (
          <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
            <SortableContext items={displayModules.map((module) => module.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {displayModules.map((module) => (
                  <TeacherModuleRow
                    key={module.id}
                    module={module}
                    isExpanded={expandedModuleIds.has(module.id)}
                    onToggleExpand={toggleExpand}
                    onAddLesson={openAddLesson}
                    onEditModule={openEditModuleForm}
                    onDeleteModule={setDeletingModule}
                    onEditLesson={openEditLesson}
                    onDeleteLesson={setDeletingLesson}
                    onAddAssignment={openAddAssignment}
                    onEditAssignment={openEditAssignment}
                    onDeleteAssignment={setDeletingAssignment}
                    onAddQuiz={openAddQuiz}
                    onEditQuiz={openEditQuiz}
                    onDeleteQuiz={setDeletingQuiz}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <TeacherModuleFormModal
        isOpen={isModuleFormOpen}
        onClose={closeModuleForm}
        courseId={numericCourseId}
        editingModule={editingModule}
        nextOrder={modules.length + 1}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingModule)}
        onClose={() => setDeletingModule(null)}
        onConfirm={handleDeleteModuleConfirm}
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

      <ConfirmDialog
        isOpen={Boolean(deletingAssignment)}
        onClose={() => setDeletingAssignment(null)}
        onConfirm={handleDeleteAssignmentConfirm}
        isConfirming={deleteAssignmentMutation.isPending}
        title="Delete Assignment"
        message={`Are you sure you want to delete "${deletingAssignment?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <ConfirmDialog
        isOpen={Boolean(deletingQuiz)}
        onClose={() => setDeletingQuiz(null)}
        onConfirm={handleDeleteQuizConfirm}
        isConfirming={deleteQuizMutation.isPending}
        title="Delete Quiz"
        message={`Are you sure you want to delete "${deletingQuiz?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
      />

      <TeacherLessonFormModal
        isOpen={lessonModalState.isOpen}
        onClose={closeLessonModal}
        modules={modules}
        defaultModuleId={lessonModalState.moduleId}
        lesson={lessonModalState.lesson}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["modules", numericCourseId] });
        }}
      />

      <TeacherAssignmentFormModal
        isOpen={assignmentModalState.isOpen}
        onClose={closeAssignmentModal}
        modules={modules}
        defaultModuleId={assignmentModalState.moduleId}
        assignment={assignmentModalState.assignment}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["modules", numericCourseId] });
        }}
      />

      <TeacherQuizFormModal
        isOpen={quizModalState.isOpen}
        onClose={closeQuizModal}
        modules={modules}
        defaultModuleId={quizModalState.moduleId}
        quiz={quizModalState.quiz}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["modules", numericCourseId] });
        }}
      />
    </div>
  );
}
