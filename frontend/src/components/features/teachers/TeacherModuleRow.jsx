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
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Edit3,
  FileText,
  GripVertical,
  HelpCircle,
  Image as ImageIcon,
  PlayCircle,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import Loader from "@/components/ui/Loader";
import EmptyState from "@/components/ui/EmptyState";
import TeacherComingSoonModal from "@/components/features/teachers/TeacherComingSoonModal";
import { getLessons, reorderLessons } from "@/services/lessonsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import { toastError } from "@/lib/toast";

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
    return <Loader fullScreen={false} label="Loading lessons..." />;
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

export default function TeacherModuleRow({
  module,
  isExpanded,
  onToggleExpand,
  onAddLesson,
  onEditModule,
  onDeleteModule,
  onEditLesson,
  onDeleteLesson,
}) {
  const [activeTab, setActiveTab] = useState("lessons");
  const [comingSoonTarget, setComingSoonTarget] = useState(null);

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
            {module.lessons_count ?? 0} Lessons · 0 Assignments · 0 Quizzes
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
                {tab.label} · {tab.key === "lessons" ? module.lessons_count ?? 0 : 0}
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
            <div className="space-y-2">
              <EmptyState
                icon={ClipboardCheck}
                label="Assignments aren't available yet."
                description="There's no assignments feature in the app yet."
                compact
              />
              <button
                type="button"
                onClick={() => setComingSoonTarget("assignment")}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Assignment
              </button>
            </div>
          )}

          {activeTab === "quizzes" && (
            <div className="space-y-2">
              <EmptyState
                icon={HelpCircle}
                label="Quiz management isn't shown here yet."
                description="Quizzes aren't wired into module content management yet."
                compact
              />
              <button
                type="button"
                onClick={() => setComingSoonTarget("quiz")}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-stone-300 rounded-lg text-[11px] font-mono uppercase tracking-wider text-stone-400 hover:border-amber-500 hover:text-amber-700 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Quiz
              </button>
            </div>
          )}
        </div>
      )}

      <TeacherComingSoonModal
        isOpen={comingSoonTarget === "assignment"}
        onClose={() => setComingSoonTarget(null)}
        title="Assignment form coming soon"
        description="Assignment creation isn't built yet — this will let you add an assignment to this module."
      />

      <TeacherComingSoonModal
        isOpen={comingSoonTarget === "quiz"}
        onClose={() => setComingSoonTarget(null)}
        title="Quiz form coming soon"
        description="Quiz creation isn't built yet — this will let you add a quiz to this module."
      />
    </li>
  );
}
