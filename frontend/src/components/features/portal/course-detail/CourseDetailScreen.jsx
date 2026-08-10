"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  CircleHelp,
  ClipboardList,
  FileQuestion,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  RefreshCw,
  Repeat,
  UserRound,
  Video,
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
import LessonViewScreen from "../lesson-view/LessonViewScreen";
import LessonViewPending from "../lesson-view/LessonViewPending";

const ASSIGNMENT_STATUS_STYLES = {
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
  LATE: "bg-rose-50 text-rose-600 border-rose-100",
  GRADED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  RETURNED: "bg-sky-50 text-sky-700 border-sky-100",
  RESUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
};

const LESSON_TYPE_META = {
  VIDEO: { icon: Video, label: "Video", badge: "bg-sky-50 text-sky-600 border-sky-100" },
  PDF: { icon: FileText, label: "PDF", badge: "bg-rose-50 text-rose-600 border-rose-100" },
  DOCUMENT: { icon: FileText, label: "Document", badge: "bg-blue-50 text-blue-600 border-blue-100" },
  IMAGE: { icon: ImageIcon, label: "Image", badge: "bg-violet-50 text-violet-600 border-violet-100" },
  DEFAULT: { icon: FileQuestion, label: "Lesson", badge: "bg-stone-50 text-stone-500 border-stone-200" },
};

function RowIcon({ icon: Icon, className }) {
  return (
    <span
      className={`flex items-center justify-center w-8 h-8 rounded-lg border shrink-0 ${className}`}
    >
      <Icon className="w-4 h-4" />
    </span>
  );
}

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

function instructorInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function InstructorAvatar({ name, avatar }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasAvatar = Boolean(avatar) && !imageFailed;
  if (hasAvatar) {
    return (
      <img
        src={avatar}
        alt={name || "Instructor avatar"}
        onError={() => setImageFailed(true)}
        className="w-8 h-8 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600 text-white font-bold text-[10px] shrink-0">
      {instructorInitials(name)}
    </span>
  );
}

function CourseThumbnail({ image, title }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(image) && !imageFailed;
  return (
    <div className="relative w-full h-44 sm:h-56 rounded-2xl border border-stone-200 overflow-hidden shrink-0">
      <img
        src={hasImage ? image : "/images/course-placeholder.svg"}
        alt={title ? `${title} thumbnail` : "Course thumbnail"}
        onError={() => setImageFailed(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
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
  const meta = LESSON_TYPE_META[lesson.content_type] || LESSON_TYPE_META.DEFAULT;
  return (
    <button
      type="button"
      onClick={() => onOpen(lesson)}
      disabled={disabled}
      className="w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-stone-50 disabled:hover:bg-transparent disabled:cursor-default transition-colors group"
    >
      <RowIcon icon={meta.icon} className={meta.badge} />
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-stone-700 group-hover:text-amber-800 truncate transition-colors">
          {lesson.title}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
          <span>{meta.label}</span>
          {lesson.duration_minutes ? (
            <>
              <span className="w-0.5 h-0.5 rounded-full bg-stone-300 shrink-0" />
              <span>{lesson.duration_minutes}m</span>
            </>
          ) : null}
        </span>
      </span>
      {lesson.is_completed ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
      ) : (
        <Circle className="w-4 h-4 text-stone-200 shrink-0" />
      )}
    </button>
  );
}

function AssignmentRow({ assignment, onOpen }) {
  const { label, className } = assignmentStatusLabel(assignment.submission);
  return (
    <button
      type="button"
      onClick={() => onOpen(assignment)}
      className="w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-stone-50 transition-colors group"
    >
      <RowIcon icon={ClipboardList} className="bg-amber-50 text-amber-600 border-amber-100" />
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-stone-700 group-hover:text-amber-800 truncate transition-colors">
          {assignment.title}
        </span>
        {assignment.due_date ? (
          <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            <CalendarClock className="w-3 h-3 shrink-0" />
            Due {formatDateTime(assignment.due_date)}
          </span>
        ) : null}
      </span>
      <span
        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0 ${className}`}
      >
        {label}
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
      className="w-full flex items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-stone-50 transition-colors group"
    >
      <RowIcon icon={CircleHelp} className="bg-violet-50 text-violet-600 border-violet-100" />
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-stone-700 group-hover:text-amber-800 truncate transition-colors">
          {quiz.title}
        </span>
        <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
          <Repeat className="w-3 h-3 shrink-0" />
          {quiz.attempts_used}/{quiz.attempts_allowed} attempts
        </span>
      </span>
      <span
        className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0 ${className}`}
      >
        {label}
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
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
              {(module.lessons || []).length > 0 && (
                <div className="space-y-0.5 pt-2 border-t border-stone-100">
                  <p className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 px-2 pb-1">
                    <BookOpen className="w-3 h-3" />
                    Lessons
                  </p>
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
                <div className="space-y-0.5 pt-2 border-t border-stone-100">
                  <p className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 px-2 pb-1">
                    <ClipboardList className="w-3 h-3" />
                    Assignments
                  </p>
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
                <div className="space-y-0.5 pt-2 border-t border-stone-100">
                  <p className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-stone-400 px-2 pb-1">
                    <HelpCircle className="w-3 h-3" />
                    Quizzes
                  </p>
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseId = enrollment?.course?.id;
  const [expandedModuleIds, setExpandedModuleIds] = useState(() => new Set());

  const contentParam = searchParams.get("content");
  const activeItem = useMemo(() => {
    if (!contentParam) return null;
    const separatorIndex = contentParam.indexOf("-");
    if (separatorIndex === -1) return null;
    const type = contentParam.slice(0, separatorIndex).toUpperCase();
    const id = Number(contentParam.slice(separatorIndex + 1));
    if (!["LESSON", "ASSIGNMENT", "QUIZ"].includes(type) || !Number.isFinite(id)) return null;
    return { type, id };
  }, [contentParam]);

  function openContent(type, id) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("content", `${type.toLowerCase()}-${id}`);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function closeContent() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("content");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  // Tracks the last courseId this effect actually reacted to — compared by value rather
  // than a "have we mounted yet" boolean, because React's Strict Mode replays effects
  // once in dev: a boolean flag would already read "mounted" on that replay and treat it
  // as a real course switch, wiping the `content` param and bouncing a refreshed lesson
  // view back to the course overview even though courseId never changed.
  const lastReactedCourseIdRef = useRef(courseId);

  useEffect(() => {
    if (lastReactedCourseIdRef.current === courseId) {
      return;
    }
    lastReactedCourseIdRef.current = courseId;
    setExpandedModuleIds(new Set());
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("content")) {
      params.delete("content");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const courseInstructors = course.instructors || [];
  const fallbackInstructorName =
    courseInstructors.find((item) => item.is_lead)?.name ||
    courseInstructors[0]?.name ||
    "Instructor TBD";
  const assignedInstructor = detailEnrollment.teacher || null;

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
      {!activeItem && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:border-amber-300 hover:text-amber-800 text-stone-600 text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to My Courses
        </button>
      )}

      {(isLoading || (!data && !isError)) &&
        (activeItem ? (
          <LessonViewPending />
        ) : (
          <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
            <Loader fullScreen={false} label="Loading course details..." />
          </div>
        ))}

      {isError &&
        (activeItem ? (
          <LessonViewPending
            isError
            errorMessage={getApiErrorMessage(error, "Unable to load course details.")}
            onRetry={() => refetch()}
          />
        ) : (
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
        ))}

      {data && activeItem && (
        <LessonViewScreen
          course={course}
          courseId={courseId}
          modules={modules}
          courseAssignments={courseAssignments}
          courseQuizzes={courseQuizzes}
          assignmentsByModule={assignmentsByModule}
          quizzesByModule={quizzesByModule}
          courseLevelAssignments={courseLevelAssignments}
          courseLevelQuizzes={courseLevelQuizzes}
          canInteract={canInteract}
          activeItem={activeItem}
          onSelectItem={openContent}
          onExit={closeContent}
        />
      )}

      {data && !activeItem && (
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

          <CourseThumbnail image={course.image} title={course.title} />

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
                      onOpen={(item) => openContent("assignment", item.id)}
                    />
                  ))}
                  {courseLevelQuizzes.map((quiz) => (
                    <QuizRow
                      key={quiz.id}
                      quiz={quiz}
                      onOpen={(item) => openContent("quiz", item.id)}
                    />
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
                        onOpenLesson={(lesson) => openContent("lesson", lesson.id)}
                        onOpenAssignment={(assignment) => openContent("assignment", assignment.id)}
                        onOpenQuiz={(quiz) => openContent("quiz", quiz.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
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

                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="space-y-2">
                    <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
                      Instructor
                    </p>
                    {assignedInstructor ? (
                      <div className="flex items-center gap-2.5">
                        <InstructorAvatar
                          name={assignedInstructor.name}
                          avatar={assignedInstructor.avatar}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-stone-800 truncate">
                            {assignedInstructor.name}
                          </p>
                          {assignedInstructor.email ? (
                            <p className="text-[10px] text-stone-400 font-mono truncate">
                              {assignedInstructor.email}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[12px] text-stone-600">
                        <UserRound className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{fallbackInstructorName}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 text-[12px] text-stone-600">
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
    </div>
  );
}
