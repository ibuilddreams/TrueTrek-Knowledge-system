"use client";

import { useEffect, useMemo, useState } from "react";
import { useCourseLessons } from "@/hooks/student/useCourseLessons";
import { PortalCrumbs } from "../shell/PortalUI";
import ContentPlayerPanel from "./ContentPlayerPanel";
import CurriculumPanel from "./CurriculumPanel";

function findModuleIdForLesson(modules, lessonId) {
  const module = modules.find((item) =>
    (item.lessons || []).some((lesson) => lesson.id === lessonId),
  );
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
  onBackToCourses,
}) {
  const lessonCompletionById = useMemo(() => {
    const map = new Map();
    modules.forEach((module) => {
      (module.lessons || []).forEach((lesson) => map.set(lesson.id, lesson.is_completed));
    });
    return map;
  }, [modules]);

  // Every lesson of the course in reading order — what Previous and Next
  // step through, and which module heading the reader prints.
  const orderedLessons = useMemo(() => {
    const rows = [];
    modules.forEach((module, moduleIndex) => {
      (module.lessons || []).forEach((lesson) => {
        rows.push({ lesson, module, moduleIndex });
      });
    });
    return rows;
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

  // Only the open lesson's module fetches its full content. The rail is drawn
  // from the course payload, so nothing else needs loading.
  const [fetchedModuleIds, setFetchedModuleIds] = useState(
    () => new Set(activeModuleId ? [activeModuleId] : []),
  );

  useEffect(() => {
    if (!activeModuleId) return;
    setFetchedModuleIds((prev) => {
      if (prev.has(activeModuleId)) return prev;
      const next = new Set(prev);
      next.add(activeModuleId);
      return next;
    });
  }, [activeModuleId]);

  const { lessonsByModuleId, loadingModuleIds } = useCourseLessons(modules, fetchedModuleIds);

  const activeIndex = useMemo(
    () =>
      activeItem?.type === "LESSON"
        ? orderedLessons.findIndex((row) => row.lesson.id === activeItem.id)
        : -1,
    [activeItem, orderedLessons],
  );

  const activeLesson = useMemo(() => {
    if (activeItem?.type !== "LESSON" || !activeModuleId) return null;
    const found = (lessonsByModuleId.get(activeModuleId) || []).find(
      (lesson) => lesson.id === activeItem.id,
    );
    if (!found) return null;
    return { ...found, is_completed: lessonCompletionById.get(found.id) ?? found.is_completed };
  }, [activeItem, activeModuleId, lessonsByModuleId, lessonCompletionById]);

  const isResolving =
    activeItem?.type === "LESSON" && !activeLesson && loadingModuleIds.has(activeModuleId);

  const activeRow = activeIndex >= 0 ? orderedLessons[activeIndex] : null;
  // Where the open item's module sits in the course — what the assignment
  // and quiz screens print as "Module 2 of 3".
  const activeModulePosition = modules.findIndex((module) => module.id === activeModuleId);
  const previousLesson = activeIndex > 0 ? orderedLessons[activeIndex - 1].lesson : null;
  const nextLesson =
    activeIndex >= 0 && activeIndex < orderedLessons.length - 1
      ? orderedLessons[activeIndex + 1].lesson
      : null;

  const activeTitle =
    activeItem?.type === "LESSON"
      ? activeRow?.lesson?.title
      : activeItem?.type === "ASSIGNMENT"
        ? activeAssignment?.title
        : activeQuiz?.title;

  return (
    <>
      <PortalCrumbs
        items={[
          { label: "My courses", onClick: onBackToCourses },
          { label: course?.code || course?.title || "Course", onClick: onExit },
          { label: activeTitle || "Lesson" },
        ]}
      />

      <div className="grid grid-cols-[minmax(0,2.4fr)_minmax(280px,1fr)] items-start gap-5 max-[72rem]:grid-cols-1">
        <div className="min-w-0">
          <ContentPlayerPanel
            activeItem={activeItem}
            lesson={activeLesson}
            moduleIndex={
              activeItem?.type === "LESSON" ? activeRow?.moduleIndex : activeModulePosition
            }
            moduleTitle={activeRow?.module?.title}
            moduleCount={modules.length}
            assignment={activeAssignment}
            quiz={activeQuiz}
            isResolving={isResolving}
            courseId={courseId}
            canInteract={canInteract}
            previousLesson={previousLesson}
            nextLesson={nextLesson}
            onSelectItem={onSelectItem}
          />
        </div>

        <div className="min-[72.0625rem]:sticky min-[72.0625rem]:top-[96px]">
          <CurriculumPanel
            modules={modules}
            assignmentsByModule={assignmentsByModule}
            quizzesByModule={quizzesByModule}
            courseLevelAssignments={courseLevelAssignments}
            courseLevelQuizzes={courseLevelQuizzes}
            activeItem={activeItem}
            onSelectItem={onSelectItem}
          />
        </div>
      </div>
    </>
  );
}
