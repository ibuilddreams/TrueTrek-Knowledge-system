"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useCourseLessons } from "@/hooks/student/useCourseLessons";
import FullScreenPortal from "./FullScreenPortal";
import ContentPlayerPanel from "./ContentPlayerPanel";
import CurriculumPanel from "./CurriculumPanel";

function findModuleIdForLesson(modules, lessonId) {
  const module = modules.find((item) => (item.lessons || []).some((lesson) => lesson.id === lessonId));
  return module?.id ?? null;
}

export default function LessonViewScreen({
  course,
  courseId,
  modules,
  courseAssignments,
  courseQuizzes,
  assignmentsByModule,
  quizzesByModule,
  courseLevelAssignments,
  courseLevelQuizzes,
  canInteract,
  activeItem,
  onSelectItem,
  onExit,
}) {
  const { isVault } = useTheme();

  const lessonCompletionById = useMemo(() => {
    const map = new Map();
    modules.forEach((module) => {
      (module.lessons || []).forEach((lesson) => map.set(lesson.id, lesson.is_completed));
    });
    return map;
  }, [modules]);

  const activeAssignment = useMemo(() => {
    if (activeItem?.type !== "ASSIGNMENT") return null;
    return courseAssignments.find((assignment) => assignment.id === activeItem.id) || null;
  }, [activeItem, courseAssignments]);

  const activeQuiz = useMemo(() => {
    if (activeItem?.type !== "QUIZ") return null;
    return courseQuizzes.find((quiz) => quiz.id === activeItem.id) || null;
  }, [activeItem, courseQuizzes]);

  // The lightweight `modules` summary already lists which module a lesson belongs to
  // (id + is_completed only, no file/video_url) — enough to know which module's full
  // lesson content actually needs fetching, without waiting on that fetch first.
  const activeModuleId = useMemo(() => {
    if (!activeItem) return null;
    if (activeItem.type === "LESSON") return findModuleIdForLesson(modules, activeItem.id);
    if (activeItem.type === "ASSIGNMENT") return activeAssignment?.module?.id ?? null;
    if (activeItem.type === "QUIZ") return activeQuiz?.module?.id ?? null;
    return null;
  }, [activeItem, modules, activeAssignment, activeQuiz]);

  // Only the active item's module needs to fetch its full lesson content up front —
  // everything else loads lazily as the student expands it in the curriculum panel,
  // same as the course overview's accordion. Fetching every module immediately would
  // fire one request per module for no benefit on courses with many modules.
  const [expandedModuleIds, setExpandedModuleIds] = useState(
    () => new Set(activeModuleId ? [activeModuleId] : [])
  );

  useEffect(() => {
    if (!activeModuleId) return;
    setExpandedModuleIds((prev) => {
      if (prev.has(activeModuleId)) return prev;
      const next = new Set(prev);
      next.add(activeModuleId);
      return next;
    });
  }, [activeModuleId]);

  function toggleModule(moduleId) {
    setExpandedModuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  const { lessonsByModuleId, loadingModuleIds } = useCourseLessons(modules, expandedModuleIds);

  const activeLesson = useMemo(() => {
    if (activeItem?.type !== "LESSON" || !activeModuleId) return null;
    const found = (lessonsByModuleId.get(activeModuleId) || []).find(
      (lesson) => lesson.id === activeItem.id
    );
    if (!found) return null;
    return { ...found, is_completed: lessonCompletionById.get(found.id) ?? found.is_completed };
  }, [activeItem, activeModuleId, lessonsByModuleId, lessonCompletionById]);

  const isResolving =
    activeItem?.type === "LESSON" && !activeLesson && loadingModuleIds.has(activeModuleId);

  return (
    <FullScreenPortal>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onExit}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-[11px] font-mono uppercase tracking-wider rounded-xl transition ${
              isVault
                ? "border-stone-700 hover:border-amber-500/50 hover:text-amber-400 text-stone-400"
                : "border-stone-200 hover:border-amber-300 hover:text-amber-800 text-stone-600"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to course
          </button>
          <p
            className={`text-xs font-mono uppercase tracking-wider truncate max-w-[60%] text-right ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            {course?.title}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
          <div className="min-w-0">
            <ContentPlayerPanel
              activeItem={activeItem}
              lesson={activeLesson}
              assignment={activeAssignment}
              quiz={activeQuiz}
              isResolving={isResolving}
              courseId={courseId}
              canInteract={canInteract}
            />
          </div>

          <div className="lg:sticky lg:top-6">
            <CurriculumPanel
              modules={modules}
              lessonsByModuleId={lessonsByModuleId}
              loadingModuleIds={loadingModuleIds}
              lessonCompletionById={lessonCompletionById}
              assignmentsByModule={assignmentsByModule}
              quizzesByModule={quizzesByModule}
              courseLevelAssignments={courseLevelAssignments}
              courseLevelQuizzes={courseLevelQuizzes}
              activeItem={activeItem}
              onSelectItem={onSelectItem}
              expandedModuleIds={expandedModuleIds}
              onToggleModule={toggleModule}
              isVault={isVault}
            />
          </div>
        </div>
      </div>
    </FullScreenPortal>
  );
}
