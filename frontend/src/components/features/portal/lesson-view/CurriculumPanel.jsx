"use client";

import { CircleHelp, ClipboardList } from "lucide-react";
import { getPortalAssignmentStatus, getPortalQuizStatus } from "@/lib/curriculumMeta";
import PortalCard from "../shell/PortalCard";
import {
  PortalIcon,
  PortalKicker,
  PortalPill,
  PortalSectionLabel,
  PortalTick,
} from "../shell/PortalUI";

/**
 * The lesson screen's course rail — the design's `courseSideNav`.
 *
 * It is deliberately flat rather than an accordion: a student reading one
 * lesson is looking for the next, and the design shows the whole course at
 * once. Everything it draws comes from the course detail's own `modules`
 * payload (lesson titles and completion are already in it), so opening a
 * lesson costs no request per module.
 */
function RailRow({ isActive, isDisabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-current={isActive ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-cn-p-sm border-0 px-2 py-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
        isActive
          ? "bg-cn-p-soft font-semibold text-cn-p-soft-ink"
          : "bg-transparent text-cn-p-ink hover:bg-cn-p-page disabled:hover:bg-transparent"
      }`}
    >
      {children}
    </button>
  );
}

export default function CurriculumPanel({
  modules,
  assignmentsByModule,
  quizzesByModule,
  courseLevelAssignments,
  courseLevelQuizzes,
  activeItem,
  onSelectItem,
}) {
  const isItemActive = (type, id) => activeItem?.type === type && activeItem?.id === id;

  const renderAssignment = (assignment, isLockedModule, label) => {
    const status = getPortalAssignmentStatus({
      ...assignment,
      is_locked: assignment.is_locked || isLockedModule,
    });
    return (
      <RailRow
        key={`assignment-${assignment.id}`}
        isActive={isItemActive("ASSIGNMENT", assignment.id)}
        isDisabled={isLockedModule}
        onClick={() => onSelectItem("ASSIGNMENT", assignment.id)}
      >
        <PortalIcon icon={ClipboardList} />
        <span className="min-w-0 flex-1 truncate text-[13px]">{label}</span>
        <PortalPill tone={status.tone}>{status.label}</PortalPill>
      </RailRow>
    );
  };

  const renderQuiz = (quiz, isLockedModule, label) => {
    const status = getPortalQuizStatus({
      ...quiz,
      is_locked: quiz.is_locked || isLockedModule,
    });
    return (
      <RailRow
        key={`quiz-${quiz.id}`}
        isActive={isItemActive("QUIZ", quiz.id)}
        isDisabled={isLockedModule}
        onClick={() => onSelectItem("QUIZ", quiz.id)}
      >
        <PortalIcon icon={CircleHelp} />
        <span className="min-w-0 flex-1 truncate text-[13px]">{label}</span>
        <PortalPill tone={status.tone}>{status.label}</PortalPill>
      </RailRow>
    );
  };

  return (
    <PortalCard className="flex max-h-[calc(100vh-120px)] flex-col gap-1 overflow-y-auto p-4">
      <PortalKicker className="px-2 pt-1 pb-2">Course curriculum</PortalKicker>

      {(courseLevelAssignments.length > 0 || courseLevelQuizzes.length > 0) && (
        <>
          <PortalSectionLabel>Course-wide</PortalSectionLabel>
          {courseLevelAssignments.map((assignment) =>
            renderAssignment(assignment, false, assignment.title),
          )}
          {courseLevelQuizzes.map((quiz) => renderQuiz(quiz, false, quiz.title))}
        </>
      )}

      {modules.map((module, index) => {
        const moduleAssignments = assignmentsByModule.get(module.id) || [];
        const moduleQuizzes = quizzesByModule.get(module.id) || [];
        const isLocked = Boolean(module.is_locked);
        return (
          <div key={module.id}>
            <PortalSectionLabel>
              Module {index + 1} · {module.title}
            </PortalSectionLabel>

            {(module.lessons || []).map((lesson) => (
              <RailRow
                key={lesson.id}
                isActive={isItemActive("LESSON", lesson.id)}
                isDisabled={isLocked}
                onClick={() => onSelectItem("LESSON", lesson.id)}
              >
                <PortalTick isOn={lesson.is_completed} size={20} />
                <span className="min-w-0 flex-1 truncate text-[13px]">{lesson.title}</span>
              </RailRow>
            ))}

            {moduleAssignments.map((assignment) =>
              renderAssignment(
                assignment,
                isLocked,
                moduleAssignments.length === 1 ? "Assignment" : assignment.title,
              ),
            )}
            {moduleQuizzes.map((quiz) =>
              renderQuiz(quiz, isLocked, moduleQuizzes.length === 1 ? "Quiz" : quiz.title),
            )}
          </div>
        );
      })}
    </PortalCard>
  );
}
