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
    <div className="rounded-2xl border overflow-hidden flex flex-col max-h-[85vh] border-line bg-paper">
      <div className="px-4 py-3.5 border-b border-line">
        <p className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted">
          <ListVideo className="w-3.5 h-3.5 text-gold" />
          Course curriculum
        </p>
        <p className="text-sm mt-1 text-muted">
          {modules.length} module{modules.length === 1 ? "" : "s"} · {totalLessons} lesson
          {totalLessons === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {(courseLevelAssignments.length > 0 || courseLevelQuizzes.length > 0) && (
          <div className="rounded-xl border p-2.5 space-y-1 border-line">
            <p className="text-[10px] font-mono uppercase tracking-wider px-1 pb-1 text-muted">
              Course-wide
            </p>
            {courseLevelAssignments.map((assignment) => {
              const { label, className } = getAssignmentStatusMeta(assignment.submission);
              return (
                <CurriculumItemRow
                  key={`assignment-${assignment.id}`}
                  icon={ClipboardList}
                  iconClassName="bg-gold/12 text-gold border-gold/25"
                  title={assignment.title}
                  statusLabel={label}
                  statusClassName={className}
                  isActive={isItemActive("ASSIGNMENT", assignment.id)}
                  onClick={() => onSelectItem("ASSIGNMENT", assignment.id)}
                />
              );
            })}
            {courseLevelQuizzes.map((quiz) => {
              const { label, className } = getQuizStatusMeta(quiz);
              return (
                <CurriculumItemRow
                  key={`quiz-${quiz.id}`}
                  icon={HelpCircle}
                  iconClassName="bg-violet-50 text-violet-600 border-violet-100"
                  title={quiz.title}
                  statusLabel={label}
                  statusClassName={className}
                  isActive={isItemActive("QUIZ", quiz.id)}
                  onClick={() => onSelectItem("QUIZ", quiz.id)}
                />
              );
            })}
          </div>
        )}

        {modules.length === 0 ? (
          <div className="text-center py-10">
            <Layers className="w-5 h-5 mx-auto mb-2 text-muted" />
            <p className="text-sm text-muted">
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
            />
          ))
        )}
      </div>
    </div>
  );
}
