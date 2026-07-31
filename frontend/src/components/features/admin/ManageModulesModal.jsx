"use client";

import { useEffect, useMemo, useState } from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Edit3,
  FileText,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  ListChecks,
  ListPlus,
  Maximize2,
  Minimize2,
  Paperclip,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  Video,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Loader from "@/components/ui/Loader";
import ContentRowSkeleton from "@/components/ui/ContentRowSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import AddLessonModal from "@/components/features/admin/AddLessonModal";
import AddAssignmentModal from "@/components/features/admin/AddAssignmentModal";
import AssignmentAttachmentsModal from "@/components/features/admin/AssignmentAttachmentsModal";
import AddQuizModal from "@/components/features/admin/AddQuizModal";
import QuizQuestionsModal from "@/components/features/admin/QuizQuestionsModal";
import {
  createModule,
  deleteModule,
  getModules,
  reorderModules,
  updateModule,
} from "@/services/modulesService";
import { deleteLesson, getLessons, reorderLessons } from "@/services/lessonsService";
import {
  deleteAssignment,
  getAssignments,
  publishAssignment,
  reorderAssignments,
} from "@/services/assignmentsService";
import {
  deleteQuiz,
  getQuizzes,
  publishQuiz,
  reorderQuizzes,
} from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate, formatDateTime } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";

const INITIAL_FORM = { title: "", description: "", order: "1" };

const FIELD_CLASS =
  "w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60";

const LABEL_CLASS = "text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold";

const ERROR_CLASS = "text-[10px] font-mono text-red-600 mt-1";

const TABS = [
  { key: "lessons", label: "Lessons", icon: PlayCircle },
  { key: "assignments", label: "Assignments", icon: ClipboardCheck },
  { key: "quizzes", label: "Quizzes", icon: HelpCircle },
];

function formatLessonDate(value) {
  return formatDate(value);
}

function formatDueDate(value) {
  return formatDateTime(value) || "—";
}

function isPastDue(value) {
  if (!value) return false;
  return new Date(value).getTime() < Date.now();
}

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

function SortableLessonItem({ lesson, moduleId, onEditLesson, onDeleteLesson }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const LessonIcon =
    lesson.content_type === "VIDEO" ? Video : lesson.content_type === "IMAGE" ? ImageIcon : FileText;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-stone-300 cursor-grab shrink-0 touch-none"
        title="Drag to reorder"
        aria-hidden="true"
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
        <LessonIcon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-stone-800 truncate">{lesson.title}</p>
        <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-0.5">
          {lesson.content_type}
          {lesson.duration_minutes ? ` · ${lesson.duration_minutes} min` : ""} ·{" "}
          {formatLessonDate(lesson.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onEditLesson(lesson)}
          title="Edit lesson"
          aria-label="Edit lesson"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteLesson({ id: lesson.id, title: lesson.title, moduleId })}
          title="Delete lesson"
          aria-label="Delete lesson"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

function ModuleLessonsList({ moduleId, onAddLesson, onEditLesson, onDeleteLesson }) {
  const queryClient = useQueryClient();
  const [localLessonOrderIds, setLocalLessonOrderIds] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const lessonsQuery = useQuery({
    queryKey: ["lessons", moduleId],
    queryFn: async () => {
      const response = await getLessons({ moduleId });
      return response?.data?.results || [];
    },
  });
  const lessons = lessonsQuery.data || [];

  const reorderLessonsMutation = useMutation({
    mutationFn: (entries) => reorderLessons(moduleId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", moduleId] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to reorder lessons."));
    },
  });

  const displayLessons = useMemo(() => {
    if (!localLessonOrderIds) return lessons;
    const currentIds = lessons.map((lesson) => lesson.id);
    const sameSet =
      localLessonOrderIds.length === currentIds.length &&
      localLessonOrderIds.every((id) => currentIds.includes(id));
    if (!sameSet) return lessons;
    const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
    return localLessonOrderIds.map((id) => lessonById.get(id));
  }, [lessons, localLessonOrderIds]);

  const handleLessonDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = displayLessons.map((lesson) => lesson.id);
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderIds = arrayMove(currentIds, oldIndex, newIndex);
    setLocalLessonOrderIds(newOrderIds);

    const payload = newOrderIds.map((id, index) => ({ lesson_id: id, order: index + 1 }));
    reorderLessonsMutation.mutate(payload);
  };

  if (lessonsQuery.isLoading) {
    return <ContentRowSkeleton count={3} />;
  }

  return (
    <div className="space-y-2">
      {displayLessons.length > 0 && (
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
          <SortableContext
            items={displayLessons.map((lesson) => lesson.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {displayLessons.map((lesson) => (
                <SortableLessonItem
                  key={lesson.id}
                  lesson={lesson}
                  moduleId={moduleId}
                  onEditLesson={onEditLesson}
                  onDeleteLesson={onDeleteLesson}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={() => onAddLesson(moduleId)}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Lesson
      </button>
    </div>
  );
}

function SortableAssignmentItem({
  assignment,
  moduleId,
  onEditAssignment,
  onDeleteAssignment,
  onPublishAssignment,
  isPublishing,
  onManageAttachments,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: assignment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const overdue = assignment.status === "PUBLISHED" && isPastDue(assignment.due_date);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-stone-300 cursor-grab shrink-0 touch-none"
        title="Drag to reorder"
        aria-hidden="true"
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
        <ClipboardCheck className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-stone-800 truncate">{assignment.title}</p>
          <StatusBadge status={assignment.status} />
        </div>
        <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-0.5 flex items-center gap-1 flex-wrap">
          <Calendar className="w-2.5 h-2.5" />
          <span className={overdue ? "text-rose-500" : ""}>{formatDueDate(assignment.due_date)}</span>
          <span className="text-stone-200">·</span>
          <span>{assignment.total_marks} marks</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onManageAttachments(assignment)}
          title="Manage attachments"
          aria-label="Manage attachments"
          className="relative w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
        >
          <Paperclip className="w-3.5 h-3.5" />
          {assignment.attachments?.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-1 rounded-full bg-amber-600 text-white text-[9px] font-mono font-bold flex items-center justify-center">
              {assignment.attachments.length}
            </span>
          )}
        </button>
        {assignment.status === "DRAFT" && (
          <button
            type="button"
            onClick={() => onPublishAssignment(assignment)}
            disabled={isPublishing}
            title="Publish assignment"
            aria-label="Publish assignment"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-emerald-600 hover:bg-emerald-50 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onEditAssignment(assignment)}
          title="Edit assignment"
          aria-label="Edit assignment"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteAssignment({ id: assignment.id, title: assignment.title, moduleId })}
          title="Delete assignment"
          aria-label="Delete assignment"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

function ModuleAssignmentsList({ moduleId, onAddAssignment, onEditAssignment, onDeleteAssignment }) {
  const queryClient = useQueryClient();
  const [localAssignmentOrderIds, setLocalAssignmentOrderIds] = useState(null);
  const [attachmentsModalAssignment, setAttachmentsModalAssignment] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const assignmentsQuery = useQuery({
    queryKey: ["assignments", moduleId],
    queryFn: async () => {
      const response = await getAssignments({ moduleId });
      return response?.data?.results || [];
    },
  });
  const assignments = assignmentsQuery.data || [];

  const reorderAssignmentsMutation = useMutation({
    mutationFn: (entries) => reorderAssignments(moduleId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", moduleId] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to reorder assignments."));
    },
  });

  const publishAssignmentMutation = useMutation({
    mutationFn: (assignment) => publishAssignment(assignment.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", moduleId] });
      toastSuccess(response?.message || "Assignment published successfully.");
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to publish assignment."));
    },
  });

  const displayAssignments = useMemo(() => {
    if (!localAssignmentOrderIds) return assignments;
    const currentIds = assignments.map((assignment) => assignment.id);
    const sameSet =
      localAssignmentOrderIds.length === currentIds.length &&
      localAssignmentOrderIds.every((id) => currentIds.includes(id));
    if (!sameSet) return assignments;
    const assignmentById = new Map(assignments.map((assignment) => [assignment.id, assignment]));
    return localAssignmentOrderIds.map((id) => assignmentById.get(id));
  }, [assignments, localAssignmentOrderIds]);

  const handleAssignmentDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = displayAssignments.map((assignment) => assignment.id);
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderIds = arrayMove(currentIds, oldIndex, newIndex);
    setLocalAssignmentOrderIds(newOrderIds);

    const payload = newOrderIds.map((id, index) => ({ assignment_id: id, order: index + 1 }));
    reorderAssignmentsMutation.mutate(payload);
  };

  if (assignmentsQuery.isLoading) {
    return <ContentRowSkeleton count={3} />;
  }

  return (
    <div className="space-y-2">
      {displayAssignments.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          label="No assignments in this module yet."
          description="Create an assignment for students to submit work against."
          compact
        />
      ) : (
        <DndContext
          sensors={dndSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleAssignmentDragEnd}
        >
          <SortableContext
            items={displayAssignments.map((assignment) => assignment.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {displayAssignments.map((assignment) => (
                <SortableAssignmentItem
                  key={assignment.id}
                  assignment={assignment}
                  moduleId={moduleId}
                  onEditAssignment={onEditAssignment}
                  onDeleteAssignment={onDeleteAssignment}
                  onPublishAssignment={publishAssignmentMutation.mutate}
                  isPublishing={publishAssignmentMutation.isPending}
                  onManageAttachments={setAttachmentsModalAssignment}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={() => onAddAssignment(moduleId)}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Assignment
      </button>

      <AssignmentAttachmentsModal
        isOpen={Boolean(attachmentsModalAssignment)}
        onClose={() => setAttachmentsModalAssignment(null)}
        assignment={attachmentsModalAssignment}
        moduleId={moduleId}
      />
    </div>
  );
}

function SortableQuizItem({
  quiz,
  moduleId,
  onEditQuiz,
  onDeleteQuiz,
  onPublishQuiz,
  isPublishing,
  onManageQuestions,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: quiz.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-stone-300 cursor-grab shrink-0 touch-none"
        title="Drag to reorder"
        aria-hidden="true"
      >
        <GripVertical className="w-4 h-4" />
      </span>
      <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
        <HelpCircle className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-stone-800 truncate">{quiz.title}</p>
          <StatusBadge status={quiz.status} />
        </div>
        <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-0.5 flex items-center gap-1 flex-wrap">
          <span>{quiz.total_marks} marks</span>
          <span className="text-stone-200">·</span>
          <span>{quiz.passing_score}% to pass</span>
          <span className="text-stone-200">·</span>
          <span>{quiz.attempts_allowed} attempt{quiz.attempts_allowed === 1 ? "" : "s"}</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onManageQuestions(quiz)}
          title="Manage questions"
          aria-label="Manage questions"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
        >
          <ListChecks className="w-3.5 h-3.5" />
        </button>
        {quiz.status === "DRAFT" && (
          <button
            type="button"
            onClick={() => onPublishQuiz(quiz)}
            disabled={isPublishing}
            title="Publish quiz"
            aria-label="Publish quiz"
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-emerald-600 hover:bg-emerald-50 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onEditQuiz(quiz)}
          title="Edit quiz"
          aria-label="Edit quiz"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteQuiz({ id: quiz.id, title: quiz.title, moduleId })}
          title="Delete quiz"
          aria-label="Delete quiz"
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

function ModuleQuizzesList({ moduleId, onAddQuiz, onEditQuiz, onDeleteQuiz }) {
  const queryClient = useQueryClient();
  const [localQuizOrderIds, setLocalQuizOrderIds] = useState(null);
  const [questionsModalQuiz, setQuestionsModalQuiz] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const quizzesQuery = useQuery({
    queryKey: ["quizzes", moduleId],
    queryFn: async () => {
      const response = await getQuizzes({ moduleId });
      return response?.data?.results || [];
    },
  });
  const quizzes = quizzesQuery.data || [];

  const reorderQuizzesMutation = useMutation({
    mutationFn: (entries) => reorderQuizzes(moduleId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", moduleId] });
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to reorder quizzes."));
    },
  });

  const publishQuizMutation = useMutation({
    mutationFn: (quiz) => publishQuiz(quiz.id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", moduleId] });
      toastSuccess(response?.message || "Quiz published successfully.");
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to publish quiz."));
    },
  });

  const displayQuizzes = useMemo(() => {
    if (!localQuizOrderIds) return quizzes;
    const currentIds = quizzes.map((quiz) => quiz.id);
    const sameSet =
      localQuizOrderIds.length === currentIds.length &&
      localQuizOrderIds.every((id) => currentIds.includes(id));
    if (!sameSet) return quizzes;
    const quizById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    return localQuizOrderIds.map((id) => quizById.get(id));
  }, [quizzes, localQuizOrderIds]);

  const handleQuizDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentIds = displayQuizzes.map((quiz) => quiz.id);
    const oldIndex = currentIds.indexOf(active.id);
    const newIndex = currentIds.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrderIds = arrayMove(currentIds, oldIndex, newIndex);
    setLocalQuizOrderIds(newOrderIds);

    const payload = newOrderIds.map((id, index) => ({ quiz_id: id, order: index + 1 }));
    reorderQuizzesMutation.mutate(payload);
  };

  if (quizzesQuery.isLoading) {
    return <ContentRowSkeleton count={3} />;
  }

  return (
    <div className="space-y-2">
      {displayQuizzes.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          label="No quizzes in this module yet."
          description="Create a quiz to assess what students have learned."
          compact
        />
      ) : (
        <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleQuizDragEnd}>
          <SortableContext items={displayQuizzes.map((quiz) => quiz.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {displayQuizzes.map((quiz) => (
                <SortableQuizItem
                  key={quiz.id}
                  quiz={quiz}
                  moduleId={moduleId}
                  onEditQuiz={onEditQuiz}
                  onDeleteQuiz={onDeleteQuiz}
                  onPublishQuiz={publishQuizMutation.mutate}
                  isPublishing={publishQuizMutation.isPending}
                  onManageQuestions={setQuestionsModalQuiz}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <button
        type="button"
        onClick={() => onAddQuiz(moduleId)}
        className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Quiz
      </button>

      <QuizQuestionsModal
        isOpen={Boolean(questionsModalQuiz)}
        onClose={() => setQuestionsModalQuiz(null)}
        quiz={questionsModalQuiz}
      />
    </div>
  );
}

function SortableModuleItem({
  module,
  isExpanded,
  toggleExpand,
  openAddLesson,
  openEditForm,
  setDeletingModule,
  openEditLesson,
  setDeletingLesson,
  openAddAssignment,
  openEditAssignment,
  setDeletingAssignment,
  openAddQuiz,
  openEditQuiz,
  setDeletingQuiz,
}) {
  const [activeTab, setActiveTab] = useState("lessons");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border border-stone-200 bg-stone-100/70 overflow-hidden ${
        isDragging ? "z-10 shadow-lg opacity-90" : ""
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <span
          {...attributes}
          {...listeners}
          className="text-stone-300 cursor-grab shrink-0 touch-none"
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
        <div className="border-t border-stone-200 bg-stone-50/60 px-4 py-4 space-y-4">
          <div className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "text-stone-500 hover:text-stone-700"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label} ·{" "}
                {tab.key === "lessons"
                  ? module.lessons_count ?? 0
                  : tab.key === "assignments"
                    ? module.assignments_count ?? 0
                    : module.quizzes_count ?? 0}
              </button>
            ))}
          </div>

          {activeTab === "lessons" && (
            <ModuleLessonsList
              moduleId={module.id}
              onAddLesson={openAddLesson}
              onEditLesson={openEditLesson}
              onDeleteLesson={setDeletingLesson}
            />
          )}

          {activeTab === "assignments" && (
            <ModuleAssignmentsList
              moduleId={module.id}
              onAddAssignment={openAddAssignment}
              onEditAssignment={openEditAssignment}
              onDeleteAssignment={setDeletingAssignment}
            />
          )}

          {activeTab === "quizzes" && (
            <ModuleQuizzesList
              moduleId={module.id}
              onAddQuiz={openAddQuiz}
              onEditQuiz={openEditQuiz}
              onDeleteQuiz={setDeletingQuiz}
            />
          )}
        </div>
      )}
    </li>
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
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    setExpandedModuleIds(new Set());
    setLessonModalState({ isOpen: false, moduleId: null, lesson: null });
    setAssignmentModalState({ isOpen: false, moduleId: null, assignment: null });
    setQuizModalState({ isOpen: false, moduleId: null, quiz: null });
    setLocalModuleOrderIds(null);
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

  const deleteAssignmentMutation = useMutation({
    mutationFn: (assignment) => deleteAssignment(assignment.id),
    onSuccess: (_data, assignment) => {
      queryClient.invalidateQueries({ queryKey: ["assignments", assignment.moduleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: (quiz) => deleteQuiz(quiz.id),
    onSuccess: (_data, quiz) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", quiz.moduleId] });
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });

  const reorderModulesMutation = useMutation({
    mutationFn: (entries) => reorderModules(courseId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
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

  const isSubmitting = createModuleMutation.isPending || updateModuleMutation.isPending;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const openCreateForm = () => {
    setEditingModule(null);
    setForm({ ...INITIAL_FORM, order: String(modules.length + 1) });
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (module) => {
    setEditingModule(module);
    setForm({
      title: module.title || "",
      description: module.description || "",
      order: String(module.order ?? 1),
    });
    setFieldErrors({});
    setIsFormOpen(true);
  };

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setFieldErrors((prev) => ({ ...prev, [field]: null }));
  };

  const areAllExpanded = modules.length > 0 && modules.every((module) => expandedModuleIds.has(module.id));

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

  const closeAddLesson = () => {
    setLessonModalState({ isOpen: false, moduleId: null, lesson: null });
  };

  const openAddAssignment = (moduleId) => {
    setAssignmentModalState({ isOpen: true, moduleId, assignment: null });
  };

  const openEditAssignment = (assignment) => {
    setAssignmentModalState({ isOpen: true, moduleId: null, assignment });
  };

  const closeAddAssignment = () => {
    setAssignmentModalState({ isOpen: false, moduleId: null, assignment: null });
  };

  const openAddQuiz = (moduleId) => {
    setQuizModalState({ isOpen: true, moduleId, quiz: null });
  };

  const openEditQuiz = (quiz) => {
    setQuizModalState({ isOpen: true, moduleId: null, quiz });
  };

  const closeAddQuiz = () => {
    setQuizModalState({ isOpen: false, moduleId: null, quiz: null });
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
            <p className="mt-1.5 text-[10px] font-mono text-stone-400">1 = first position</p>
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
          <div className="flex items-center justify-between gap-3">
            {modules.length > 0 ? (
              <button
                type="button"
                onClick={toggleExpandAll}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 text-[11px] font-semibold font-mono rounded-xl tracking-wider border border-stone-200 shadow-sm transition-all cursor-pointer"
              >
                {areAllExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                {areAllExpanded ? "Collapse All" : "Expand All"}
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={openCreateForm}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-xs font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
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
            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleModuleDragEnd}
            >
              <SortableContext
                items={displayModules.map((module) => module.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-3">
                  {displayModules.map((module) => (
                    <SortableModuleItem
                      key={module.id}
                      module={module}
                      isExpanded={expandedModuleIds.has(module.id)}
                      toggleExpand={toggleExpand}
                      openAddLesson={openAddLesson}
                      openEditForm={openEditForm}
                      setDeletingModule={setDeletingModule}
                      openEditLesson={openEditLesson}
                      setDeletingLesson={setDeletingLesson}
                      openAddAssignment={openAddAssignment}
                      openEditAssignment={openEditAssignment}
                      setDeletingAssignment={setDeletingAssignment}
                      openAddQuiz={openAddQuiz}
                      openEditQuiz={openEditQuiz}
                      setDeletingQuiz={setDeletingQuiz}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
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

      <AddAssignmentModal
        isOpen={assignmentModalState.isOpen}
        onClose={closeAddAssignment}
        modules={modules}
        defaultModuleId={assignmentModalState.moduleId}
        assignment={assignmentModalState.assignment}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
        }}
      />

      <AddQuizModal
        isOpen={quizModalState.isOpen}
        onClose={closeAddQuiz}
        modules={modules}
        defaultModuleId={quizModalState.moduleId}
        quiz={quizModalState.quiz}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
        }}
      />
    </Modal>
  );
}
