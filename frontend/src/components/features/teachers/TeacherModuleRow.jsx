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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Edit3,
  FileText,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  ListChecks,
  Paperclip,
  PlayCircle,
  Plus,
  Send,
  Trash2,
  Video,
} from "lucide-react";
import ContentRowSkeleton from "@/components/ui/ContentRowSkeleton";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import TeacherAssignmentAttachmentsModal from "@/components/features/teachers/TeacherAssignmentAttachmentsModal";
import TeacherQuizQuestionsModal from "@/components/features/teachers/TeacherQuizQuestionsModal";
import { getLessons, reorderLessons } from "@/services/lessonsService";
import { getAssignments, publishAssignment, reorderAssignments } from "@/services/assignmentsService";
import { getQuizzes, publishQuiz, reorderQuizzes } from "@/services/quizzesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate, formatDateTime } from "@/lib/adminFormatters";
import { toastError, toastSuccess } from "@/lib/toast";

const LESSON_ICONS = {
  VIDEO: Video,
  IMAGE: ImageIcon,
  PDF: FileText,
  DOCUMENT: FileText,
};

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

function SortableTeacherLessonItem({ lesson, moduleId, onEditLesson, onDeleteLesson }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const LessonIcon = LESSON_ICONS[lesson.content_type] || FileText;

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

function TeacherLessonsPanel({ moduleId, onAddLesson, onEditLesson, onDeleteLesson }) {
  const queryClient = useQueryClient();
  const [localLessonOrderIds, setLocalLessonOrderIds] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
          <SortableContext items={displayLessons.map((lesson) => lesson.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {displayLessons.map((lesson) => (
                <SortableTeacherLessonItem
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

function SortableTeacherAssignmentItem({
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

function TeacherAssignmentsPanel({ moduleId, onAddAssignment, onEditAssignment, onDeleteAssignment }) {
  const queryClient = useQueryClient();
  const [localAssignmentOrderIds, setLocalAssignmentOrderIds] = useState(null);
  const [attachmentsModalAssignment, setAttachmentsModalAssignment] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
                <SortableTeacherAssignmentItem
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

      <TeacherAssignmentAttachmentsModal
        isOpen={Boolean(attachmentsModalAssignment)}
        onClose={() => setAttachmentsModalAssignment(null)}
        assignment={attachmentsModalAssignment}
        moduleId={moduleId}
      />
    </div>
  );
}

function SortableTeacherQuizItem({
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

function TeacherQuizzesPanel({ moduleId, onAddQuiz, onEditQuiz, onDeleteQuiz }) {
  const queryClient = useQueryClient();
  const [localQuizOrderIds, setLocalQuizOrderIds] = useState(null);
  const [questionsModalQuiz, setQuestionsModalQuiz] = useState(null);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
                <SortableTeacherQuizItem
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

      <TeacherQuizQuestionsModal
        isOpen={Boolean(questionsModalQuiz)}
        onClose={() => setQuestionsModalQuiz(null)}
        quiz={questionsModalQuiz}
      />
    </div>
  );
}

export default function TeacherModuleRow({
  module,
  isExpanded,
  onToggleExpand,
  onAddLesson,
  onEditModule,
  onDeleteModule,
  onEditLesson,
  onDeleteLesson,
  onAddAssignment,
  onEditAssignment,
  onDeleteAssignment,
  onAddQuiz,
  onEditQuiz,
  onDeleteQuiz,
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
      className={`rounded-2xl border border-stone-200 bg-white overflow-hidden ${
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

        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
          {module.order ?? 1}
        </div>

        <button
          type="button"
          onClick={() => onToggleExpand(module.id)}
          className="min-w-0 flex-1 text-left cursor-pointer"
        >
          <p className="font-serif text-base font-bold text-stone-900 truncate">{module.title}</p>
          <p className="text-[10px] font-mono uppercase text-stone-400 tracking-wider mt-1">
            {module.lessons_count ?? 0} Lessons · {module.assignments_count ?? 0} Assignments ·{" "}
            {module.quizzes_count ?? 0} Quizzes
          </p>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEditModule(module)}
            title="Edit module"
            aria-label="Edit module"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteModule(module)}
            title="Delete module"
            aria-label="Delete module"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onToggleExpand(module.id)}
            aria-label={isExpanded ? "Collapse module" : "Expand module"}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-100 transition cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
            <TeacherLessonsPanel
              moduleId={module.id}
              onAddLesson={onAddLesson}
              onEditLesson={onEditLesson}
              onDeleteLesson={onDeleteLesson}
            />
          )}

          {activeTab === "assignments" && (
            <TeacherAssignmentsPanel
              moduleId={module.id}
              onAddAssignment={onAddAssignment}
              onEditAssignment={onEditAssignment}
              onDeleteAssignment={onDeleteAssignment}
            />
          )}

          {activeTab === "quizzes" && (
            <TeacherQuizzesPanel
              moduleId={module.id}
              onAddQuiz={onAddQuiz}
              onEditQuiz={onEditQuiz}
              onDeleteQuiz={onDeleteQuiz}
            />
          )}
        </div>
      )}
    </li>
  );
}
