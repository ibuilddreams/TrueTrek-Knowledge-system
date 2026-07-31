"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleHelp,
  ClipboardList,
  HelpCircle,
  Layers,
  Lock,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getStudentEnrolledCourseDetail } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate, formatDateTime } from "@/lib/adminFormatters";
import { useModuleLessons } from "@/hooks/student/useModuleLessons";
import { useStudentAssignments } from "@/hooks/student/useStudentAssignments";
import { useStudentQuizzes } from "@/hooks/student/useStudentQuizzes";
import Loader from "@/components/ui/Loader";
import StatusBadge from "@/components/ui/StatusBadge";
import LessonViewerModal from "./LessonViewerModal";
import AssignmentDetailModal from "./AssignmentDetailModal";
import QuizAttemptModal from "./QuizAttemptModal";

const ASSIGNMENT_STATUS_STYLES = {
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
  LATE: "bg-rose-50 text-rose-600 border-rose-100",
  GRADED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  RETURNED: "bg-sky-50 text-sky-700 border-sky-100",
  RESUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
};

function ProgressBar({ value }) {
  const progress = Math.round(value || 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-400">
        <span>Overall progress</span>
        <span className="text-amber-800 font-bold">{progress}%</span>
      </div>
      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            progress >= 80 ? "bg-emerald-500" : "bg-amber-600"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2.5">
      <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p className="text-base font-serif font-bold text-stone-900 mt-0.5">{value}</p>
    </div>
  );
}

function assignmentStatusLabel(submission) {
  if (!submission) {
    return { label: "Not submitted", className: "bg-stone-50 text-stone-500 border-stone-200" };
  }
  const className =
    ASSIGNMENT_STATUS_STYLES[submission.status] || "bg-stone-50 text-stone-500 border-stone-200";
  return { label: submission.status, className };
}

function quizStatusLabel(quiz) {
  const attempt = quiz.latest_attempt;
  if (!attempt) return { label: "Not attempted", className: "bg-stone-50 text-stone-500 border-stone-200" };
  if (attempt.status === "IN_PROGRESS") {
    return { label: "In progress", className: "bg-amber-50 text-amber-700 border-amber-100" };
  }
  if (attempt.is_passed === true) {
    return { label: "Passed", className: "bg-emerald-50 text-emerald-700 border-emerald-100" };
  }
  if (attempt.is_passed === false) {
    return { label: "Failed", className: "bg-rose-50 text-rose-600 border-rose-100" };
  }
  return { label: "Submitted", className: "bg-stone-50 text-stone-500 border-stone-200" };
}

function LessonRow({ lesson, onOpen, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(lesson)}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 text-[12px] text-stone-700 py-1.5 text-left hover:text-amber-800 disabled:hover:text-stone-700 disabled:cursor-default transition"
    >
      {lesson.is_completed ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      ) : (
        <Circle className="w-3.5 h-3.5 text-stone-300 shrink-0" />
      )}
      <span className="truncate flex-1">{lesson.title}</span>
      {lesson.duration_minutes ? (
        <span className="text-[10px] font-mono text-stone-400 shrink-0">
          {lesson.duration_minutes}m
        </span>
      ) : null}
    </button>
  );
}

function AssignmentRow({ assignment, onOpen }) {
  const { label, className } = assignmentStatusLabel(assignment.submission);
  return (
    <button
      type="button"
      onClick={() => onOpen(assignment)}
      className="w-full flex items-center justify-between gap-2 text-[12px] text-stone-600 py-1 text-left hover:text-amber-800 transition"
    >
      <span className="inline-flex items-center gap-2 min-w-0">
        <ClipboardList className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="truncate">{assignment.title}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        {assignment.due_date ? (
          <span className="text-[10px] font-mono text-stone-400">
            Due {formatDateTime(assignment.due_date)}
          </span>
        ) : null}
        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${className}`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

function QuizRow({ quiz, onOpen }) {
  const { label, className } = quizStatusLabel(quiz);
  return (
    <button
      type="button"
      onClick={() => onOpen(quiz)}
      className="w-full flex items-center justify-between gap-2 text-[12px] text-stone-600 py-1 text-left hover:text-amber-800 transition"
    >
      <span className="inline-flex items-center gap-2 min-w-0">
        <CircleHelp className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span className="truncate">{quiz.title}</span>
      </span>
      <span className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono text-stone-400">
          {quiz.attempts_used}/{quiz.attempts_allowed} attempts
        </span>
        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${className}`}
        >
          {label}
        </span>
      </span>
    </button>
  );
}

function ModuleAccordionItem({
  module,
  isExpanded,
  onToggle,
  moduleAssignments,
  moduleQuizzes,
  canInteract,
  onOpenLesson,
  onOpenAssignment,
  onOpenQuiz,
}) {
  const { data: fullLessons } = useModuleLessons(module.id, isExpanded);

  const lessonCompletionById = useMemo(() => {
    const map = new Map();
    (module.lessons || []).forEach((lesson) => map.set(lesson.id, lesson.is_completed));
    return map;
  }, [module.lessons]);

  const displayLessons = useMemo(() => {
    if (fullLessons && fullLessons.length) {
      return fullLessons.map((lesson) => ({
        ...lesson,
        is_completed: lessonCompletionById.get(lesson.id) ?? false,
      }));
    }
    return null;
  }, [fullLessons, lessonCompletionById]);

  const hasDetails =
    (module.lessons || []).length > 0 ||
    moduleAssignments.length > 0 ||
    moduleQuizzes.length > 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full text-left p-4 sm:p-5 space-y-3 hover:bg-stone-50/70 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              Module {module.order + 1}
            </p>
            <h5 className="font-serif font-bold text-stone-900 mt-0.5 truncate">
              {module.title}
            </h5>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
                module.is_completed
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                  : "bg-stone-50 text-stone-500 border-stone-200"
              }`}
            >
              {Math.round(module.completion_percentage || 0)}%
            </span>
            {hasDetails ? (
              isExpanded ? (
                <ChevronUp className="w-4 h-4 text-stone-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-500" />
              )
            ) : null}
          </div>
        </div>

        {module.description ? (
          <p className="text-[11px] text-stone-500 font-light leading-relaxed line-clamp-2">
            {module.description}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-stone-400">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {module.stats?.completed_lessons || 0}/
            {module.stats?.total_lessons || 0} lessons
          </span>
          <span className="inline-flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            {moduleQuizzes.length || module.stats?.total_quizzes || 0} quizzes
          </span>
          <span className="inline-flex items-center gap-1">
            <ClipboardList className="w-3 h-3" />
            {moduleAssignments.length || module.stats?.total_assignments || 0} assigns
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
              {(module.lessons || []).length > 0 && (
                <div className="space-y-0.5 pt-1 border-t border-stone-100">
                  {displayLessons === null ? (
                    <div className="py-2">
                      <Loader fullScreen={false} label="Loading lessons..." />
                    </div>
                  ) : (
                    displayLessons.map((lesson) => (
                      <LessonRow
                        key={lesson.id}
                        lesson={lesson}
                        onOpen={onOpenLesson}
                        disabled={false}
                      />
                    ))
                  )}
                </div>
              )}

              {moduleAssignments.length > 0 && (
                <div className="space-y-0.5 pt-1 border-t border-stone-100">
                  {moduleAssignments.map((assignment) => (
                    <AssignmentRow
                      key={assignment.id}
                      assignment={assignment}
                      onOpen={onOpenAssignment}
                    />
                  ))}
                </div>
              )}

              {moduleQuizzes.length > 0 && (
                <div className="space-y-0.5 pt-1 border-t border-stone-100">
                  {moduleQuizzes.map((quiz) => (
                    <QuizRow key={quiz.id} quiz={quiz} onOpen={onOpenQuiz} />
                  ))}
                </div>
              )}

              {!canInteract ? (
                <p className="flex items-center gap-1.5 text-[10px] text-stone-400 pt-1">
                  <Lock className="w-3 h-3" />
                  Actions are disabled while this enrollment isn&apos;t active.
                </p>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CourseDetailScreen({ enrollment, onBack }) {
  const courseId = enrollment?.course?.id;
  const [expandedModuleIds, setExpandedModuleIds] = useState(() => new Set());
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    setExpandedModuleIds(new Set());
    setSelectedLesson(null);
    setSelectedAssignment(null);
    setSelectedQuiz(null);
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [courseId]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["studentEnrolledCourseDetail", courseId],
    queryFn: async () => {
      const response = await getStudentEnrolledCourseDetail(courseId);
      return response?.data || null;
    },
    enabled: Boolean(courseId),
  });

  const { data: allAssignments = [] } = useStudentAssignments({ enabled: Boolean(courseId) });
  const { data: allQuizzes = [] } = useStudentQuizzes({ enabled: Boolean(courseId) });

  const course = data?.course || enrollment?.course || {};
  const detailEnrollment = data?.enrollment || enrollment || {};
  const stats = data?.stats || {};
  const modules = data?.modules || [];
  const instructors = course.instructors || [];
  const leadInstructor =
    instructors.find((item) => item.is_lead)?.name ||
    instructors[0]?.name ||
    "Instructor TBD";

  const canInteract = detailEnrollment.status === "ACTIVE";

  const courseAssignments = useMemo(
    () => allAssignments.filter((assignment) => assignment.course?.id === courseId),
    [allAssignments, courseId]
  );
  const courseQuizzes = useMemo(
    () => allQuizzes.filter((quiz) => quiz.course?.id === courseId),
    [allQuizzes, courseId]
  );

  const assignmentsByModule = useMemo(() => {
    const map = new Map();
    courseAssignments.forEach((assignment) => {
      if (!assignment.module) return;
      const list = map.get(assignment.module.id) || [];
      list.push(assignment);
      map.set(assignment.module.id, list);
    });
    return map;
  }, [courseAssignments]);

  const quizzesByModule = useMemo(() => {
    const map = new Map();
    courseQuizzes.forEach((quiz) => {
      if (!quiz.module) return;
      const list = map.get(quiz.module.id) || [];
      list.push(quiz);
      map.set(quiz.module.id, list);
    });
    return map;
  }, [courseQuizzes]);

  const courseLevelAssignments = useMemo(
    () => courseAssignments.filter((assignment) => !assignment.module),
    [courseAssignments]
  );
  const courseLevelQuizzes = useMemo(
    () => courseQuizzes.filter((quiz) => !quiz.module),
    [courseQuizzes]
  );

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:border-amber-300 hover:text-amber-800 text-stone-600 text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to My Courses
      </button>

      {(isLoading || (!data && !isError)) && (
        <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
          <Loader fullScreen={false} label="Loading course details..." />
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-xs text-rose-600 mb-4">
            {getApiErrorMessage(error, "Unable to load course details.")}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-xs font-mono uppercase rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-700/80 mb-1">
                Course dossier
              </p>
              <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 leading-tight">
                {course.title || "Course details"}
              </h2>
              <p className="text-xs text-stone-500 font-light mt-1.5">
                {course.category?.name || "General"}
                {course.code ? ` · ${course.code}` : ""}
              </p>
            </div>
            <StatusBadge status={detailEnrollment.status} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6 min-w-0">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 space-y-4">
                <p className="text-sm text-stone-600 font-light leading-relaxed">
                  {course.description || "No course description has been added yet."}
                </p>

                {!canInteract ? (
                  <div className="flex items-start gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3 text-xs text-stone-500">
                    <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      This enrollment is {detailEnrollment.status?.toLowerCase()} — lessons,
                      assignments, and quizzes can&apos;t be interacted with until it&apos;s
                      active again.
                    </span>
                  </div>
                ) : null}
              </div>

              {(courseLevelAssignments.length > 0 || courseLevelQuizzes.length > 0) && (
                <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    Course-wide assignments & quizzes
                  </h4>
                  {courseLevelAssignments.map((assignment) => (
                    <AssignmentRow
                      key={assignment.id}
                      assignment={assignment}
                      onOpen={setSelectedAssignment}
                    />
                  ))}
                  {courseLevelQuizzes.map((quiz) => (
                    <QuizRow key={quiz.id} quiz={quiz} onOpen={setSelectedQuiz} />
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <h4 className="font-serif font-bold text-stone-900">Modules & lessons</h4>
                  <p className="text-xs text-stone-500 font-light mt-0.5">
                    Your learning path inside this enrolled course.
                  </p>
                </div>

                {modules.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-8 text-center">
                    <Layers className="w-5 h-5 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs text-stone-500">
                      No modules have been published for this course yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modules.map((module) => (
                      <ModuleAccordionItem
                        key={module.id}
                        module={module}
                        isExpanded={expandedModuleIds.has(module.id)}
                        onToggle={() => {
                          setExpandedModuleIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(module.id)) {
                              next.delete(module.id);
                            } else {
                              next.add(module.id);
                            }
                            return next;
                          });
                        }}
                        moduleAssignments={assignmentsByModule.get(module.id) || []}
                        moduleQuizzes={quizzesByModule.get(module.id) || []}
                        canInteract={canInteract}
                        onOpenLesson={setSelectedLesson}
                        onOpenAssignment={setSelectedAssignment}
                        onOpenQuiz={setSelectedQuiz}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-6">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
                <ProgressBar value={stats.completion_percentage} />

                <div className="grid grid-cols-2 gap-2.5">
                  <StatChip
                    label="Modules"
                    value={`${stats.completed_modules || 0}/${stats.total_modules || 0}`}
                  />
                  <StatChip
                    label="Lessons"
                    value={`${stats.completed_lessons || 0}/${stats.total_lessons || 0}`}
                  />
                  <StatChip
                    label="Assignments"
                    value={`${
                      courseAssignments.filter((assignment) => assignment.submission).length
                    }/${courseAssignments.length}`}
                  />
                  <StatChip label="Quizzes" value={stats.total_quizzes || 0} />
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-2.5 text-[12px] text-stone-600">
                  <div className="flex items-center gap-2">
                    <UserRound className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{leadInstructor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Enrolled {formatDate(detailEnrollment.enrolled_at)}</span>
                  </div>
                  {course.duration_minutes ? (
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{course.duration_minutes} minutes total</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <LessonViewerModal
        lesson={selectedLesson}
        courseId={courseId}
        canInteract={canInteract}
        onClose={() => setSelectedLesson(null)}
      />
      <AssignmentDetailModal
        assignment={selectedAssignment}
        canInteract={canInteract}
        onClose={() => setSelectedAssignment(null)}
      />
      <QuizAttemptModal
        quiz={selectedQuiz}
        canInteract={canInteract}
        onClose={() => setSelectedQuiz(null)}
      />
    </div>
  );
}
