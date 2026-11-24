"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CircleHelp, RefreshCw } from "lucide-react";
import { useStudentQuizAttempts } from "@/hooks/student/useStudentQuizAttempts";
import { useStudentQuizzes } from "@/hooks/student/useStudentQuizzes";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate } from "@/lib/adminFormatters";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import { usePaginationAnchor } from "@/hooks/usePaginationAnchor";
import PortalCard from "../shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPageHead,
  PortalPill,
  PortalTable,
  PortalTabs,
  PortalTd,
  PortalTh,
  PortalTr,
} from "../shell/PortalUI";
import QuizAttemptHistoryModal from "../history/QuizAttemptHistoryModal";
import QuizAttemptModal from "../course-detail/QuizAttemptModal";

// The design's `SP.quizzes`: one table of every quiz across every course,
// filtered by a strip of status tabs, with the Course column doing the work the
// old course-card drill-down did.
//
// Three of the tabs are the design's own (Open / Passed / Locked). The fourth,
// Attempts, is not in the design and is kept because this app has something the
// design's mock does not: a full attempt history, every try with its score and
// outcome. Dropping it to match a mock would have deleted a real feature, so it
// lives as a fourth tab over the same table rather than a second screen.
//
// The design's subtitle says "Pass mark is 70%, with three attempts each". Both
// halves are false here — the pass mark is per quiz (`passing_score`) and
// attempts are unlimited (see the retake rule below) — so the wording is this
// app's rather than the mock's. A screen that states a rule students are graded
// against has to state the real one.

// Ten a page, matching every other paginated table in the portal. The design's
// mock shows no pager because its seed data is a handful of rows; a real roster
// is hundreds, and a tab that renders all of them is a scroll nobody finishes.
const PAGE_SIZE = 10;

function isAbandoned(attempt) {
  return attempt.status === "EXPIRED" || attempt.status === "ABANDONED";
}

// Attempts are unlimited: a quiz is open again as soon as there is no
// in-progress attempt sitting on it to resume instead.
function bucketOf(quiz, passedQuizIds) {
  if (quiz.is_locked) return "locked";
  if (passedQuizIds.has(quiz.id)) return "passed";
  return "open";
}

function quizStatus(quiz, passedQuizIds) {
  if (quiz.is_locked) return { label: "Locked", tone: "neutral" };
  if (quiz.latest_attempt?.status === "IN_PROGRESS") {
    return { label: "In progress", tone: "warn" };
  }
  if (passedQuizIds.has(quiz.id)) return { label: "Passed", tone: "ok" };
  if (quiz.latest_attempt?.is_passed === false) {
    return { label: "Not passed", tone: "bad" };
  }
  if (!quiz.is_available) {
    return quiz.available_from
      ? { label: `Opens ${formatDate(quiz.available_from)}`, tone: "neutral" }
      : { label: "Unavailable", tone: "neutral" };
  }
  return { label: "To do", tone: "blue" };
}

function attemptStatus(attempt) {
  if (attempt.status === "IN_PROGRESS") return { label: "In progress", tone: "warn" };
  if (attempt.status === "EXPIRED") return { label: "Expired", tone: "neutral" };
  if (attempt.status === "ABANDONED") return { label: "Abandoned", tone: "neutral" };
  if (attempt.is_passed === true) return { label: "Passed", tone: "ok" };
  if (attempt.is_passed === false) return { label: "Failed", tone: "bad" };
  return { label: attempt.status, tone: "neutral" };
}

export default function QuizzesTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseFilter = searchParams.get("quizCourse") || "";
  const [tab, setTab] = useState("open");
  const [page, setPage] = useState(1);
  const [resultsRef, changePage] = usePaginationAnchor(setPage);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [detailAttemptId, setDetailAttemptId] = useState(null);

  const {
    data: quizzes = [],
    isLoading: isQuizzesLoading,
    isError: isQuizzesError,
    error: quizzesError,
    refetch: refetchQuizzes,
  } = useStudentQuizzes();

  const {
    data: attempts = [],
    isLoading: isAttemptsLoading,
    isError: isAttemptsError,
    error: attemptsError,
    refetch: refetchAttempts,
  } = useStudentQuizAttempts();

  const { data: enrollments = [] } = useQuery({
    queryKey: ["studentEnrollments"],
    queryFn: async () => {
      const response = await getStudentEnrollments({ page: 1, pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const isLoading = isQuizzesLoading || isAttemptsLoading;
  const isError = isQuizzesError || isAttemptsError;
  const error = quizzesError || attemptsError;

  function refetch() {
    refetchQuizzes();
    refetchAttempts();
  }

  const activeCourseIds = useMemo(() => {
    const ids = new Set();
    enrollments.forEach((enrollment) => {
      if (enrollment.course?.id && enrollment.status === "ACTIVE") {
        ids.add(enrollment.course.id);
      }
    });
    return ids;
  }, [enrollments]);

  // Best score and "has ever passed", per quiz, read from the attempt history
  // rather than from `latest_attempt`: a student who passes and then retakes
  // for a better mark has a latest attempt that may be worse, and neither the
  // Passed tab nor the Best column should forget the pass.
  const { bestByQuiz, passedQuizIds } = useMemo(() => {
    const best = new Map();
    const passed = new Set();
    attempts.forEach((attempt) => {
      const quizId = attempt.quiz?.id;
      if (!quizId) return;
      if (attempt.is_passed === true) passed.add(quizId);
      const pct = attempt.percentage;
      if (pct === null || pct === undefined) return;
      if (!best.has(quizId) || pct > best.get(quizId)) best.set(quizId, pct);
    });
    return { bestByQuiz: best, passedQuizIds: passed };
  }, [attempts]);

  const courses = useMemo(() => {
    const map = new Map();
    quizzes.forEach((quiz) => {
      if (quiz.course?.id && !map.has(quiz.course.id)) {
        map.set(quiz.course.id, quiz.course);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    );
  }, [quizzes]);

  const scopedQuizzes = useMemo(
    () =>
      courseFilter
        ? quizzes.filter((quiz) => String(quiz.course?.id) === courseFilter)
        : quizzes,
    [quizzes, courseFilter],
  );

  const scopedAttempts = useMemo(
    () =>
      courseFilter
        ? attempts.filter((attempt) => String(attempt.course?.id) === courseFilter)
        : attempts,
    [attempts, courseFilter],
  );

  const counts = useMemo(() => {
    const tally = { open: 0, passed: 0, locked: 0 };
    scopedQuizzes.forEach((quiz) => {
      tally[bucketOf(quiz, passedQuizIds)] += 1;
    });
    return { ...tally, attempts: scopedAttempts.length };
  }, [scopedQuizzes, scopedAttempts, passedQuizIds]);

  const quizRows = useMemo(
    () => scopedQuizzes.filter((quiz) => bucketOf(quiz, passedQuizIds) === tab),
    [scopedQuizzes, tab, passedQuizIds],
  );

  // Finished attempts first, newest first; an in-progress one has no end date
  // and sorts after them rather than to the top on a missing value.
  const attemptRows = useMemo(
    () =>
      [...scopedAttempts].sort((a, b) => {
        const aDone = Boolean(a.ended_at);
        const bDone = Boolean(b.ended_at);
        if (aDone !== bDone) return aDone ? -1 : 1;
        if (aDone && bDone) {
          return new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime();
        }
        return 0;
      }),
    [scopedAttempts],
  );

  const selectedQuiz = useMemo(
    () => (selectedQuizId ? quizzes.find((quiz) => quiz.id === selectedQuizId) || null : null),
    [quizzes, selectedQuizId],
  );

  // One pager serves both tables — the Attempts tab shows a different list, so
  // the active one decides what is being paged.
  const activeRows = tab === "attempts" ? attemptRows : quizRows;
  const totalPages = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  // Derived, never stored: a filter can shrink the list under the reader, and
  // clamping here means the table is right on the first render rather than
  // showing an empty page and then correcting itself.
  const safePage = Math.min(page, totalPages);
  const pageRows = activeRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeTab(value) {
    setTab(value);
    setPage(1);
  }

  function setCourseFilter(value) {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("quizCourse", value);
    else params.delete("quizCourse");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading your quizzes..." />
      </div>
    );
  }

  if (isError) {
    return (
      <PortalCard className="mx-auto max-w-lg p-10 text-center">
        <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h2 className="mb-2 text-xl font-bold tracking-[-0.015em] text-cn-p-ink">
          Failed to load quizzes
        </h2>
        <p className="mb-6 text-sm text-cn-p-ink-2">
          {getApiErrorMessage(error, "Unable to load your quizzes.")}
        </p>
        <PortalButton onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </PortalButton>
      </PortalCard>
    );
  }

  const isAttemptsTab = tab === "attempts";

  return (
    // `grid-cols-[minmax(0,1fr)]`, not a bare `grid`: a grid item defaults to
    // `min-width:auto` and so refuses to shrink below its content, and the
    // table below is wider than a phone. Left alone the column grew to the
    // table's intrinsic width and took the whole page with it — the heading
    // ran off the right edge and the screen scrolled sideways instead of the
    // table scrolling inside its own wrapper.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Quizzes"
        subtitle="Module knowledge checks. Each quiz carries its own pass mark, and you can retake one as many times as you need."
      >
        {courses.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-cn-p-ink-2">
            <span className="sr-only">Filter by course</span>
            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              // A <select> sizes itself to its widest option, and course
              // titles here run to sixty characters — left alone it stretched
              // past half the page and shoved itself onto a line of its own.
              // The open list still shows every title in full.
              className="h-11 max-w-[240px] truncate rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3 text-sm font-semibold text-cn-p-ink transition-[border-color] duration-150 hover:border-cn-p-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-p-accent"
            >
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </PortalPageHead>

      {quizzes.length === 0 ? (
        <PortalCard>
          <PortalEmpty
            icon={CircleHelp}
            title="No quizzes yet"
            text="Once your instructors publish quizzes in your enrolled courses, they will appear here."
          />
        </PortalCard>
      ) : (
        <PortalCard>
          <div ref={resultsRef} className="scroll-mt-24 px-4">
            <PortalTabs
              ariaLabel="Filter quizzes by status"
              options={[
                { value: "open", label: "Open", count: counts.open },
                { value: "passed", label: "Passed", count: counts.passed },
                { value: "locked", label: "Locked", count: counts.locked },
                { value: "attempts", label: "Attempts", count: counts.attempts },
              ]}
              value={tab}
              onChange={changeTab}
            />
          </div>

          {isAttemptsTab ? (
            attemptRows.length === 0 ? (
              <PortalEmpty
                icon={CircleHelp}
                title="No attempts yet"
                text="Every quiz you start shows up here with its score and outcome."
              />
            ) : (
              <PortalTable>
                <thead>
                  <tr>
                    <PortalTh>Quiz</PortalTh>
                    <PortalTh>Course</PortalTh>
                    <PortalTh align="right">Attempt</PortalTh>
                    <PortalTh align="right">Score</PortalTh>
                    <PortalTh>Finished</PortalTh>
                    <PortalTh>Status</PortalTh>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((attempt) => {
                    const status = attemptStatus(attempt);
                    return (
                      <PortalTr
                        key={attempt.attempt_id}
                        onOpen={() => setDetailAttemptId(attempt.attempt_id)}
                      >
                        <PortalTd>
                          <b className="font-semibold text-cn-p-ink">
                            {attempt.quiz?.title || "Quiz"}
                          </b>
                          {attempt.module?.title && (
                            <span className="mt-0.5 block text-[13px] text-cn-p-muted">
                              {attempt.module.title}
                            </span>
                          )}
                        </PortalTd>
                        <PortalTd className="text-sm text-cn-p-ink-2">
                          {attempt.course?.title || "—"}
                        </PortalTd>
                        <PortalTd align="right" numeric className="text-sm text-cn-p-ink-2">
                          #{attempt.attempt_number}
                        </PortalTd>
                        <PortalTd align="right" numeric className="text-sm">
                          {attempt.percentage === null || attempt.percentage === undefined ? (
                            <span className="text-cn-p-ink-2">—</span>
                          ) : (
                            <>
                              <b className="font-bold text-cn-p-ink">{attempt.percentage}%</b>
                              {attempt.score !== null && attempt.total_marks ? (
                                <span className="text-cn-p-ink-2">
                                  {" "}
                                  ({attempt.score}/{attempt.total_marks})
                                </span>
                              ) : null}
                            </>
                          )}
                        </PortalTd>
                        <PortalTd className="text-sm text-cn-p-ink-2">
                          {attempt.ended_at ? formatDate(attempt.ended_at) : "—"}
                        </PortalTd>
                        <PortalTd>
                          <PortalPill tone={status.tone}>{status.label}</PortalPill>
                        </PortalTd>
                      </PortalTr>
                    );
                  })}
                </tbody>
              </PortalTable>
            )
          ) : quizRows.length === 0 ? (
            <PortalEmpty
              icon={CircleHelp}
              title="Nothing here"
              text="Quizzes move between these tabs as you take them and pass them."
            />
          ) : (
            <PortalTable>
              <thead>
                <tr>
                  <PortalTh>Quiz</PortalTh>
                  <PortalTh>Course</PortalTh>
                  <PortalTh align="right">Questions</PortalTh>
                  <PortalTh align="right">Attempts</PortalTh>
                  <PortalTh align="right">Best</PortalTh>
                  <PortalTh>Status</PortalTh>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((quiz) => {
                  const status = quizStatus(quiz, passedQuizIds);
                  const best = bestByQuiz.get(quiz.id);
                  const isLocked = Boolean(quiz.is_locked);
                  return (
                    <PortalTr
                      key={quiz.id}
                      disabled={isLocked}
                      title={isLocked ? quiz.lock_info?.reason : undefined}
                      onOpen={isLocked ? undefined : () => setSelectedQuizId(quiz.id)}
                    >
                      <PortalTd>
                        <b className="font-semibold text-cn-p-ink">{quiz.title}</b>
                        {quiz.module?.title && (
                          <span className="mt-0.5 block text-[13px] text-cn-p-muted">
                            {quiz.module.title}
                          </span>
                        )}
                      </PortalTd>
                      <PortalTd className="text-sm text-cn-p-ink-2">
                        {quiz.course?.title || "—"}
                      </PortalTd>
                      <PortalTd align="right" numeric className="text-sm text-cn-p-ink-2">
                        {quiz.number_of_questions ?? "—"}
                      </PortalTd>
                      <PortalTd align="right" numeric className="text-sm text-cn-p-ink-2">
                        {quiz.attempts_used ?? 0}
                      </PortalTd>
                      <PortalTd align="right" numeric className="text-sm">
                        {best === undefined ? (
                          <span className="text-cn-p-ink-2">—</span>
                        ) : (
                          <b className="font-bold text-cn-p-ink">{best}%</b>
                        )}
                      </PortalTd>
                      <PortalTd>
                        <PortalPill tone={status.tone}>{status.label}</PortalPill>
                      </PortalTd>
                    </PortalTr>
                  );
                })}
              </tbody>
            </PortalTable>
          )}

          {activeRows.length > 0 && (
            <div className="px-5 pb-4">
              <Pagination
                size="lg"
                tone="cobalt"
                page={safePage}
                totalPages={totalPages}
                onPageChange={changePage}
                totalLabel={
                  tab === "attempts"
                    ? `${activeRows.length} attempt${activeRows.length === 1 ? "" : "s"}`
                    : `${activeRows.length} quiz${activeRows.length === 1 ? "" : "zes"}`
                }
              />
            </div>
          )}
        </PortalCard>
      )}

      <QuizAttemptModal
        quiz={selectedQuiz}
        canInteract={
          Boolean(selectedQuiz) && activeCourseIds.has(selectedQuiz.course?.id)
        }
        onClose={() => setSelectedQuizId(null)}
      />
      <QuizAttemptHistoryModal
        attemptId={detailAttemptId}
        onClose={() => setDetailAttemptId(null)}
      />
    </div>
  );
}
