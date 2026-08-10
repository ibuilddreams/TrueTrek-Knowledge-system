"use client";

import { useMemo } from "react";
import { ClipboardList, HelpCircle, Layers, ListVideo } from "lucide-react";
import { getAssignmentStatusMeta, getQuizStatusMeta } from "@/lib/curriculumMeta";
import CurriculumItemRow from "./CurriculumItemRow";
import CurriculumModuleGroup from "./CurriculumModuleGroup";

export default function CurriculumPanel({
  modules,
  lessonsByModuleId,
  loadingModuleIds,
  lessonCompletionById,
  assignmentsByModule,
  quizzesByModule,
  courseLevelAssignments,
  courseLevelQuizzes,
  activeItem,
  onSelectItem,
  expandedModuleIds,
  onToggleModule,
  isVault,
}) {
  // The lightweight `module.lessons` summary (always available) rather than the lazily
  // fetched full content — a collapsed, not-yet-fetched module still has a known count.
  const totalLessons = modules.reduce((sum, module) => sum + (module.lessons || []).length, 0);
  const isItemActive = (type, id) => activeItem?.type === type && activeItem?.id === id;

  const mergedLessonsByModuleId = useMemo(() => {
    const map = new Map();
    modules.forEach((module) => {
      const lessons = lessonsByModuleId.get(module.id) || [];
      map.set(
        module.id,
        lessons.map((lesson) => ({
          ...lesson,
          is_completed: lessonCompletionById.get(lesson.id) ?? lesson.is_completed ?? false,
        }))
      );
    });
    return map;
  }, [modules, lessonsByModuleId, lessonCompletionById]);

  return (
    <div
      className={`rounded-2xl border overflow-hidden flex flex-col max-h-[85vh] ${
        isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200 bg-white"
      }`}
    >
      <div className={`px-4 py-3.5 border-b ${isVault ? "border-stone-800" : "border-stone-100"}`}>
        <p
          className={`flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          <ListVideo className="w-3.5 h-3.5 text-amber-500" />
          Course curriculum
        </p>
        <p className={`text-xs mt-1 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          {modules.length} module{modules.length === 1 ? "" : "s"} · {totalLessons} lesson
          {totalLessons === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {(courseLevelAssignments.length > 0 || courseLevelQuizzes.length > 0) && (
          <div
            className={`rounded-xl border p-2.5 space-y-1 ${
              isVault ? "border-stone-800" : "border-stone-200"
            }`}
          >
            <p
              className={`text-[9px] font-mono uppercase tracking-wider px-1 pb-1 ${
                isVault ? "text-stone-500" : "text-stone-400"
              }`}
            >
              Course-wide
            </p>
            {courseLevelAssignments.map((assignment) => {
              const { label, className } = getAssignmentStatusMeta(assignment.submission, isVault);
              return (
                <CurriculumItemRow
                  key={`assignment-${assignment.id}`}
                  icon={ClipboardList}
                  iconClassName={
                    isVault
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-amber-50 text-amber-600 border-amber-100"
                  }
                  title={assignment.title}
                  statusLabel={label}
                  statusClassName={className}
                  isActive={isItemActive("ASSIGNMENT", assignment.id)}
                  isVault={isVault}
                  onClick={() => onSelectItem("ASSIGNMENT", assignment.id)}
                />
              );
            })}
            {courseLevelQuizzes.map((quiz) => {
              const { label, className } = getQuizStatusMeta(quiz, isVault);
              return (
                <CurriculumItemRow
                  key={`quiz-${quiz.id}`}
                  icon={HelpCircle}
                  iconClassName={
                    isVault
                      ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                      : "bg-violet-50 text-violet-600 border-violet-100"
                  }
                  title={quiz.title}
                  statusLabel={label}
                  statusClassName={className}
                  isActive={isItemActive("QUIZ", quiz.id)}
                  isVault={isVault}
                  onClick={() => onSelectItem("QUIZ", quiz.id)}
                />
              );
            })}
          </div>
        )}

        {modules.length === 0 ? (
          <div className="text-center py-10">
            <Layers className={`w-5 h-5 mx-auto mb-2 ${isVault ? "text-stone-700" : "text-stone-300"}`} />
            <p className={`text-xs ${isVault ? "text-stone-500" : "text-stone-500"}`}>
              No modules have been published for this course yet.
            </p>
          </div>
        ) : (
          modules.map((module) => (
            <CurriculumModuleGroup
              key={module.id}
              module={module}
              lessons={mergedLessonsByModuleId.get(module.id) || []}
              isLoadingLessons={loadingModuleIds.has(module.id)}
              moduleAssignments={assignmentsByModule.get(module.id) || []}
              moduleQuizzes={quizzesByModule.get(module.id) || []}
              activeItem={activeItem}
              onSelectItem={onSelectItem}
              isExpanded={expandedModuleIds.has(module.id)}
              onToggle={() => onToggleModule(module.id)}
              isVault={isVault}
            />
          ))
        )}
      </div>
    </div>
  );
}
