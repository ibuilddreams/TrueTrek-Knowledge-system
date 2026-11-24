"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Layers,
  Lock,
  Mail,
  MessageSquare,
  Play,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { AUTH_ROLES } from "@/constants/auth";
import { getStudentEnrolledCourseDetail } from "@/services/studentCoursesService";
import CourseFeedSection from "@/components/features/portal/course-detail/CourseFeedSection";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { parseCourseDescription } from "@/lib/courseDescription";
import { getPortalAssignmentStatus, getPortalQuizStatus } from "@/lib/curriculumMeta";
import { useStudentAssignments } from "@/hooks/student/useStudentAssignments";
import { useStudentQuizzes } from "@/hooks/student/useStudentQuizzes";
import Loader from "@/components/ui/Loader";
import PortalCard from "../shell/PortalCard";
import {
  PortalButton,
  PortalCrumbs,
  PortalEmpty,
  PortalIcon,
  PortalKicker,
  PortalKv,
  PortalKvItem,
  PortalPill,
  PortalRing,
  PortalSectionLabel,
  PortalTick,
} from "../shell/PortalUI";
import { portalHref } from "../shell/portalNav";
import LessonViewScreen from "../lesson-view/LessonViewScreen";
import LessonViewPending from "../lesson-view/LessonViewPending";

// "Nov 24, 2026" — how the design writes a due date in a module row.
function formatDueDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "Nov 04" — the design's own short enrolment date, which sits in a 2x4 tile
// grid where a full date would wrap.
function formatEnrolledDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** `.accrow` — one clickable line inside an open module. */
function AccordionRow({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-cn-p-sm border-0 bg-transparent px-2 py-3 text-left transition-colors duration-150 hover:bg-cn-p-page disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

/** `.acc` — one module, closed to a header and opened to its contents. */
function ModuleAccordionItem({
  module,
  index,
  isExpanded,
  onToggle,
  moduleAssignments,
  moduleQuizzes,
  canInteract,
  onOpenLesson,
  onOpenAssignment,
  onOpenQuiz,
}) {
  const lessons = module.lessons || [];
  const completedLessons = lessons.filter((lesson) => lesson.is_completed).length;
  const isLocked = Boolean(module.is_locked);
  const rowsDisabled = isLocked || !canInteract;
  const hasDetails =
    lessons.length > 0 || moduleAssignments.length > 0 || moduleQuizzes.length > 0;

  return (
    <div className="overflow-hidden rounded-[14px] border border-cn-p-line bg-cn-p-card">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-3.5 border-0 bg-transparent px-5 py-[18px] text-left"
      >
        <PortalIcon size="lg">
          <span className="text-sm font-bold">{index + 1}</span>
        </PortalIcon>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <b className="flex items-center gap-1.5 text-base font-bold text-cn-p-ink">
            <span className="truncate">{module.title}</span>
            {isLocked && <Lock aria-hidden="true" className="h-3.5 w-3.5 flex-none" />}
          </b>
          {module.description && (
            <span className="truncate text-[13px] text-cn-p-ink-2">
              {module.description}
            </span>
          )}
        </span>
        <span className="flex-none text-[13px] text-cn-p-ink-2">
          {completedLessons}/{lessons.length} lessons
        </span>
        <ChevronRight
          aria-hidden="true"
          className={`h-[18px] w-[18px] flex-none text-cn-p-ink-2 transition-transform duration-150 ${
            isExpanded ? "rotate-90" : ""
          }`}
        />
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
            <div className="border-t border-cn-p-line px-5 pt-1.5 pb-3.5">
              {lessons.length > 0 && (
                <>
                  <PortalSectionLabel>Lessons</PortalSectionLabel>
                  {lessons.map((lesson) => (
                    <AccordionRow
                      key={lesson.id}
                      disabled={rowsDisabled}
                      onClick={() => onOpenLesson(lesson)}
                    >
                      <PortalTick isOn={lesson.is_completed} />
                      <span className="min-w-0 flex-1 truncate text-cn-p-ink">
                        {lesson.title}
                      </span>
                      {lesson.duration_minutes ? (
                        <span className="flex-none text-xs text-cn-p-ink-2">
                          {lesson.duration_minutes} min
                        </span>
                      ) : null}
                    </AccordionRow>
                  ))}
                </>
              )}

              {moduleAssignments.length > 0 && (
                <>
                  <PortalSectionLabel>Assignment</PortalSectionLabel>
                  {moduleAssignments.map((assignment) => {
                    const status = getPortalAssignmentStatus({
                      ...assignment,
                      is_locked: assignment.is_locked || isLocked,
                    });
                    return (
                      <AccordionRow
                        key={assignment.id}
                        disabled={rowsDisabled}
                        onClick={() => onOpenAssignment(assignment)}
                      >
                        <PortalIcon icon={ClipboardList} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-cn-p-ink">{assignment.title}</span>
                          <span className="truncate text-xs text-cn-p-ink-2">
                            {assignment.due_date
                              ? `Due ${formatDueDate(assignment.due_date)}`
                              : "No due date"}
                            {assignment.total_marks ? ` · ${assignment.total_marks} marks` : ""}
                          </span>
                        </span>
                        <PortalPill tone={status.tone}>{status.label}</PortalPill>
                      </AccordionRow>
                    );
                  })}
                </>
              )}

              {moduleQuizzes.length > 0 && (
                <>
                  <PortalSectionLabel>Quiz</PortalSectionLabel>
                  {moduleQuizzes.map((quiz) => {
                    const status = getPortalQuizStatus({
                      ...quiz,
                      is_locked: quiz.is_locked || isLocked,
                    });
                    return (
                      <AccordionRow
                        key={quiz.id}
                        disabled={rowsDisabled}
                        onClick={() => onOpenQuiz(quiz)}
                      >
                        <PortalIcon icon={CircleHelp} />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-cn-p-ink">{quiz.title}</span>
                          <span className="truncate text-xs text-cn-p-ink-2">
                            {[
                              `${quiz.number_of_questions} question${
                                quiz.number_of_questions === 1 ? "" : "s"
                              }`,
                              quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : null,
                              quiz.passing_score ? `pass ${quiz.passing_score}%` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                        <PortalPill tone={status.tone}>{status.label}</PortalPill>
                      </AccordionRow>
                    );
                  })}
                </>
              )}

              {isLocked && (
                <p className="mt-2 flex items-start gap-1.5 rounded-cn-p-sm bg-cn-p-bad-bg px-3 py-2 text-xs text-cn-p-bad">
                  <Lock aria-hidden="true" className="mt-0.5 h-3 w-3 flex-none" />
                  <span>{module.lock_info?.reason || "This module is locked."}</span>
                </p>
              )}

              {!canInteract && (
                <p className="mt-2 flex items-center gap-1.5 px-2 text-xs text-cn-p-ink-2">
                  <Lock aria-hidden="true" className="h-3 w-3 flex-none" />
                  Actions are disabled while this enrollment isn&apos;t active.
                </p>
              )}
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
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }

  function closeContent() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("content");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }

  // Tracks the last courseId this effect actually reacted to — compared by value rather
  // than a "have we mounted yet" boolean, because React's Strict Mode replays effects
  // once in dev: a boolean flag would already read "mounted" on that replay and treat it
  // as a real course switch, wiping the `content` param and bouncing a refreshed lesson
  // view back to the course overview even though courseId never changed.
  const lastReactedCourseIdRef = useRef(courseId);

  useEffect(() => {
    if (lastReactedCourseIdRef.current === courseId) return;
    lastReactedCourseIdRef.current = courseId;
    setExpandedModuleIds(new Set());
    if (typeof window !== "undefined") window.scrollTo(0, 0);
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("content")) {
      params.delete("content");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const { data, isLoading, isError, error, refetch } = useQuery({
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
  const modules = useMemo(() => data?.modules || [], [data]);
  const canInteract = detailEnrollment.status === "ACTIVE";

  const courseAssignments = useMemo(
    () => allAssignments.filter((assignment) => assignment.course?.id === courseId),
    [allAssignments, courseId],
  );
  const courseQuizzes = useMemo(
    () => allQuizzes.filter((quiz) => quiz.course?.id === courseId),
    [allQuizzes, courseId],
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
    [courseAssignments],
  );
  const courseLevelQuizzes = useMemo(
    () => courseQuizzes.filter((quiz) => !quiz.module),
    [courseQuizzes],
  );

  // The first lesson, in module then lesson order, the student has not
  // finished — what "Continue" opens, and what tells Start from Continue.
  const { nextLesson, completedLessons, totalLessons } = useMemo(() => {
    let next = null;
    let done = 0;
    let total = 0;
    modules.forEach((module) => {
      (module.lessons || []).forEach((lesson) => {
        total += 1;
        if (lesson.is_completed) done += 1;
        else if (!next && !module.is_locked) next = lesson;
      });
    });
    return { nextLesson: next, completedLessons: done, totalLessons: total };
  }, [modules]);

  const descriptionParagraphs = useMemo(
    () => parseCourseDescription(course.description).paragraphs,
    [course.description],
  );

  const instructor =
    detailEnrollment.teacher ||
    course.instructors?.find((item) => item.is_lead) ||
    course.instructors?.[0] ||
    null;

  const crumbs = (
    <PortalCrumbs
      items={[
        { label: "My courses", onClick: onBack },
        { label: course.code || course.title || "Course" },
      ]}
    />
  );

  if (isLoading || (!data && !isError)) {
    return activeItem ? (
      <LessonViewPending />
    ) : (
      <>
        {crumbs}
        <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
          <Loader fullScreen={false} label="Loading course details..." />
        </div>
      </>
    );
  }

  if (isError) {
    return activeItem ? (
      <LessonViewPending
        isError
        errorMessage={getApiErrorMessage(error, "Unable to load course details.")}
        onRetry={() => refetch()}
      />
    ) : (
      <>
        {crumbs}
        <PortalCard>
          <PortalEmpty
            icon={AlertCircle}
            title="Couldn't load this course"
            text={getApiErrorMessage(error, "Unable to load course details.")}
          >
            <PortalButton onClick={() => refetch()}>
              <RefreshCw className="h-[18px] w-[18px]" />
              Retry
            </PortalButton>
          </PortalEmpty>
        </PortalCard>
      </>
    );
  }

  if (activeItem) {
    return (
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
        onBackToCourses={onBack}
      />
    );
  }

  const isComplete = detailEnrollment.is_completed || stats.completion_percentage === 100;

  return (
    <>
      {crumbs}

      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-5 max-[72rem]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-5">
          {/* The course itself, and the one button that resumes it. */}
          <PortalCard className="flex flex-col gap-3.5 p-6">
            <div className="flex flex-wrap items-center gap-2">
              {course.code && <PortalPill tone="blue">{course.code}</PortalPill>}
              {course.category?.name && <PortalPill>{course.category.name}</PortalPill>}
              <PortalPill tone={canInteract || isComplete ? "ok" : "bad"}>
                {isComplete ? "Completed" : canInteract ? "Active" : detailEnrollment.status}
              </PortalPill>
            </div>

            <h2 className="text-[28px] leading-[1.2] font-bold tracking-[-0.015em] text-cn-p-ink">
              {course.title || "Course details"}
            </h2>

            {descriptionParagraphs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {descriptionParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-base text-cn-p-ink-2">
                    {paragraph.label && (
                      <span className="font-semibold text-cn-p-ink">{paragraph.label}: </span>
                    )}
                    {paragraph.text}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-base text-cn-p-ink-2">
                No course description has been added yet.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {nextLesson && (
                <PortalButton
                  onClick={() => openContent("lesson", nextLesson.id)}
                  disabled={!canInteract}
                >
                  <Play className="h-4 w-4" />
                  {completedLessons ? "Continue" : "Start"}: {nextLesson.title}
                </PortalButton>
              )}
              <PortalButton
                variant="sec"
                onClick={() => router.push(`${portalHref(AUTH_ROLES.STUDENT, "daily")}/warroom`)}
              >
                <MessageSquare className="h-[18px] w-[18px]" />
                Course chat
              </PortalButton>
            </div>
          </PortalCard>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold tracking-[-0.01em] text-cn-p-ink">
                Modules &amp; lessons
              </h2>
              <span className="text-[13px] text-cn-p-ink-2">
                {modules.length} module{modules.length === 1 ? "" : "s"} · {totalLessons} lesson
                {totalLessons === 1 ? "" : "s"}
              </span>
            </div>

            {modules.length === 0 ? (
              <PortalCard>
                <PortalEmpty
                  icon={Layers}
                  title="Nothing published yet"
                  text="No modules have been published for this course yet."
                />
              </PortalCard>
            ) : (
              <div className="flex flex-col gap-3">
                {modules.map((module, index) => (
                  <ModuleAccordionItem
                    key={module.id}
                    module={module}
                    index={index}
                    isExpanded={expandedModuleIds.has(module.id)}
                    onToggle={() =>
                      setExpandedModuleIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(module.id)) next.delete(module.id);
                        else next.add(module.id);
                        return next;
                      })
                    }
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

          {(courseLevelAssignments.length > 0 || courseLevelQuizzes.length > 0) && (
            <PortalCard className="p-5">
              <PortalKicker>Course-wide</PortalKicker>
              <div className="mt-2">
                {courseLevelAssignments.map((assignment) => {
                  const status = getPortalAssignmentStatus(assignment);
                  return (
                    <AccordionRow
                      key={assignment.id}
                      disabled={!canInteract}
                      onClick={() => openContent("assignment", assignment.id)}
                    >
                      <PortalIcon icon={ClipboardList} />
                      <span className="min-w-0 flex-1 truncate text-cn-p-ink">
                        {assignment.title}
                      </span>
                      <PortalPill tone={status.tone}>{status.label}</PortalPill>
                    </AccordionRow>
                  );
                })}
                {courseLevelQuizzes.map((quiz) => {
                  const status = getPortalQuizStatus(quiz);
                  return (
                    <AccordionRow
                      key={quiz.id}
                      disabled={!canInteract}
                      onClick={() => openContent("quiz", quiz.id)}
                    >
                      <PortalIcon icon={CircleHelp} />
                      <span className="min-w-0 flex-1 truncate text-cn-p-ink">{quiz.title}</span>
                      <PortalPill tone={status.tone}>{status.label}</PortalPill>
                    </AccordionRow>
                  );
                })}
              </div>
            </PortalCard>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <PortalCard className="flex flex-col items-center gap-3.5 p-6 text-center">
            <PortalKicker>Overall progress</PortalKicker>
            <PortalRing
              value={stats.completion_percentage}
              size={128}
              label={`${Math.round(stats.completion_percentage || 0)}%`}
            />
            <PortalKv columns={2} className="w-full text-left">
              <PortalKvItem
                label="Lessons"
                value={`${stats.completed_lessons ?? completedLessons}/${
                  stats.total_lessons ?? totalLessons
                }`}
              />
              <PortalKvItem
                label="Assignments"
                value={`${
                  courseAssignments.filter((assignment) => assignment.submission).length
                }/${courseAssignments.length}`}
              />
              <PortalKvItem
                label="Quizzes passed"
                value={`${
                  courseQuizzes.filter((quiz) => quiz.latest_attempt?.is_passed).length
                }/${courseQuizzes.length}`}
              />
              <PortalKvItem
                label="Enrolled"
                value={formatEnrolledDate(detailEnrollment.enrolled_at) || "—"}
              />
            </PortalKv>
          </PortalCard>

          {instructor && (
            <PortalCard className="flex flex-col gap-3 p-6">
              <PortalKicker>Instructor</PortalKicker>
              <div className="flex items-center gap-3">
                {instructor.avatar ? (
                  <img
                    src={instructor.avatar}
                    alt=""
                    className="h-10 w-10 flex-none rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-cn-p-soft text-[13px] font-bold text-cn-p-soft-ink">
                    {initials(instructor.name)}
                  </span>
                )}
                <div className="flex min-w-0 flex-col">
                  <b className="truncate font-bold text-cn-p-ink">{instructor.name}</b>
                  {instructor.email && (
                    <span className="truncate text-xs text-cn-p-ink-2">{instructor.email}</span>
                  )}
                </div>
              </div>
              <PortalButton
                variant="sec"
                onClick={() => router.push(portalHref(AUTH_ROLES.STUDENT, "messages"))}
              >
                <Mail className="h-[18px] w-[18px]" />
                Message instructor
              </PortalButton>
            </PortalCard>
          )}

          <CourseFeedSection courseId={courseId} />
        </div>
      </div>
    </>
  );
}
