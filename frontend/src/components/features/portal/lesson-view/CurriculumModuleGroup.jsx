"use client";

import { ChevronDown, ChevronUp, ClipboardList, HelpCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Loader from "@/components/ui/Loader";
import { getAssignmentStatusMeta, getLessonTypeMeta, getQuizStatusMeta } from "@/lib/curriculumMeta";
import CurriculumItemRow from "./CurriculumItemRow";

export default function CurriculumModuleGroup({
  module,
  lessons,
  isLoadingLessons,
  moduleAssignments,
  moduleQuizzes,
  activeItem,
  onSelectItem,
  isExpanded,
  onToggle,
  isVault,
}) {
  // Use the lightweight `module.lessons` summary rather than the (possibly not-yet-
  // fetched) `lessons` prop — otherwise a collapsed module that genuinely has lessons
  // would look empty and lose its expand chevron before the student ever opens it.
  const hasDetails =
    (module.lessons || []).length > 0 || moduleAssignments.length > 0 || moduleQuizzes.length > 0;
  const isItemActive = (type, id) => activeItem?.type === type && activeItem?.id === id;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isVault ? "border-stone-800" : "border-stone-200"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className={`w-full text-left px-3.5 py-3 flex items-center justify-between gap-3 transition-colors ${
          isVault ? "hover:bg-white/5" : "hover:bg-stone-50/70"
        }`}
      >
        <div className="min-w-0">
          <p
            className={`text-[10px] font-mono uppercase tracking-wider ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            Module {module.order}
          </p>
          <h5
            className={`text-[13px] font-serif font-bold mt-0.5 truncate ${
              isVault ? "text-stone-100" : "text-stone-900"
            }`}
          >
            {module.title}
          </h5>
        </div>
        {hasDetails ? (
          isExpanded ? (
            <ChevronUp className={`w-4 h-4 shrink-0 ${isVault ? "text-stone-500" : "text-stone-500"}`} />
          ) : (
            <ChevronDown className={`w-4 h-4 shrink-0 ${isVault ? "text-stone-500" : "text-stone-500"}`} />
          )
        ) : null}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div
              className={`px-2.5 pb-3 space-y-3 border-t ${
                isVault ? "border-stone-800" : "border-stone-100"
              }`}
            >
              {isLoadingLessons ? (
                <div className="py-3">
                  <Loader fullScreen={false} label="Loading lessons..." />
                </div>
              ) : (
                lessons.length > 0 && (
                  <div className="space-y-0.5 pt-2">
                    {lessons.map((lesson) => {
                      const meta = getLessonTypeMeta(lesson.content_type);
                      return (
                        <CurriculumItemRow
                          key={lesson.id}
                          icon={meta.icon}
                          iconClassName={isVault ? meta.badgeVault : meta.badge}
                          title={lesson.title}
                          meta={
                            <>
                              <span>{meta.label}</span>
                              {lesson.duration_minutes ? (
                                <>
                                  <span className="w-0.5 h-0.5 rounded-full bg-current opacity-40 shrink-0" />
                                  <span>{lesson.duration_minutes}m</span>
                                </>
                              ) : null}
                            </>
                          }
                          isCompleted={lesson.is_completed}
                          isActive={isItemActive("LESSON", lesson.id)}
                          isVault={isVault}
                          onClick={() => onSelectItem("LESSON", lesson.id)}
                        />
                      );
                    })}
                  </div>
                )
              )}

              {moduleAssignments.length > 0 && (
                <div className="space-y-0.5 pt-2">
                  {moduleAssignments.map((assignment) => {
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
                </div>
              )}

              {moduleQuizzes.length > 0 && (
                <div className="space-y-0.5 pt-2">
                  {moduleQuizzes.map((quiz) => {
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
