"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock,
  RefreshCw,
  Repeat,
  Trophy,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useStudentQuizAttempts } from "@/hooks/student/useStudentQuizAttempts";
import { useStudentQuizzes } from "@/hooks/student/useStudentQuizzes";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { useTheme } from "@/hooks/useTheme";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import QuizAttemptHistoryModal from "../history/QuizAttemptHistoryModal";
import QuizAttemptModal from "../course-detail/QuizAttemptModal";
import CourseworkSummaryCard from "../CourseworkSummaryCard";

const SCORE_TONES = {
  high: { bar: "bg-emerald-500", text: "text-emerald-700", textVault: "text-emerald-400" },
  mid: { bar: "bg-amber-500", text: "text-amber-700", textVault: "text-amber-400" },
  low: { bar: "bg-rose-500", text: "text-rose-600", textVault: "text-rose-400" },
};

function scoreTone(percentage) {
  if (percentage >= 70) return SCORE_TONES.high;
  if (percentage >= 50) return SCORE_TONES.mid;
  return SCORE_TONES.low;
}

const TONE_STYLES = {
  stone: {
    light: "bg-stone-50 text-stone-500 border-stone-200",
    vault: "bg-stone-500/10 text-stone-400 border-stone-500/20",
  },
  amber: {
    light: "bg-amber-50 text-amber-700 border-amber-100",
    vault: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  rose: {
    light: "bg-rose-50 text-rose-600 border-rose-100",
    vault: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  },
  emerald: {
    light: "bg-emerald-50 text-emerald-700 border-emerald-100",
    vault: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  sky: {
    light: "bg-sky-50 text-sky-700 border-sky-100",
    vault: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  orange: {
    light: "bg-orange-50 text-orange-700 border-orange-100",
    vault: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  abandoned: {
    light: "bg-stone-100 text-stone-600 border-stone-200",
    vault: "bg-stone-500/15 text-stone-400 border-stone-500/25",
  },
};

function toneClass(tone, isVault) {
  const entry = TONE_STYLES[tone] || TONE_STYLES.stone;
  return isVault ? entry.vault : entry.light;
}

const STATUS_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PASSED", label: "Passed" },
  { id: "FAILED", label: "Failed" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "ABANDONED", label: "Expired/Abandoned" },
];

function isAbandonedStatus(attempt) {
  return attempt.status === "EXPIRED" || attempt.status === "ABANDONED";
}

function attemptStatusMeta(attempt) {
  if (attempt.status === "IN_PROGRESS") {
    return { label: "In progress", tone: "amber", icon: Clock };
  }
  if (attempt.status === "EXPIRED") {
    return { label: "Expired", tone: "orange", icon: AlertTriangle };
  }
  if (attempt.status === "ABANDONED") {
    return { label: "Abandoned", tone: "abandoned", icon: AlertTriangle };
  }
  if (attempt.is_passed === true) {
    return { label: "Passed", tone: "emerald", icon: CheckCircle2 };
  }
  if (attempt.is_passed === false) {
    return { label: "Failed", tone: "rose", icon: XCircle };
  }
  return { label: attempt.status, tone: "stone", icon: CircleHelp };
}

function sortAttempts(list) {
  return [...list].sort((a, b) => {
    const aDone = Boolean(a.ended_at);
    const bDone = Boolean(b.ended_at);
    if (aDone !== bDone) return aDone ? -1 : 1;
    if (aDone && bDone) return new Date(b.ended_at).getTime() - new Date(a.ended_at).getTime();
    return 0;
  });
}

function computeBestAttemptIds(attempts) {
  const byQuiz = new Map();
  const countByQuiz = new Map();
  attempts.forEach((attempt) => {
    const quizId = attempt.quiz?.id ?? attempt.quiz?.title;
    countByQuiz.set(quizId, (countByQuiz.get(quizId) || 0) + 1);
    if (attempt.percentage === null || attempt.percentage === undefined) return;
    const current = byQuiz.get(quizId);
    if (!current || attempt.percentage > current.percentage) {
      byQuiz.set(quizId, attempt);
    }
  });
  return new Set(
    Array.from(byQuiz.entries())
      .filter(([quizId]) => (countByQuiz.get(quizId) || 0) > 1)
      .map(([, attempt]) => attempt.attempt_id)
  );
}

function isPendingQuiz(quiz) {
  return !quiz.latest_attempt || quiz.latest_attempt.status === "IN_PROGRESS";
}

function canRetakeQuiz(quiz) {
  return (
    Boolean(quiz.latest_attempt) &&
    quiz.latest_attempt.status !== "IN_PROGRESS" &&
    quiz.attempts_used < quiz.attempts_allowed
  );
}

function isToDoQuiz(quiz) {
  return isPendingQuiz(quiz) || canRetakeQuiz(quiz);
}

function toDoPriority(quiz) {
  if (quiz.latest_attempt?.status === "IN_PROGRESS") return 0;
  if (!quiz.latest_attempt) {
    if (quiz.is_available) return 1;
    if (quiz.available_from && new Date() < new Date(quiz.available_from)) return 2;
    return 4;
  }
  return 3;
}

function sortToDoQuizzes(list) {
  return [...list].sort((a, b) => toDoPriority(a) - toDoPriority(b));
}

function quizToDoMeta(quiz) {
  const attempt = quiz.latest_attempt;

  if (attempt?.status === "IN_PROGRESS") {
    return { label: "IN PROGRESS", tone: "amber", icon: Clock, note: "Continue where you left off" };
  }

  if (!attempt) {
    if (quiz.is_available) {
      return { label: "NOT ATTEMPTED", tone: "stone", icon: CircleHelp, note: "Not started yet" };
    }
    if (quiz.available_from && new Date() < new Date(quiz.available_from)) {
      return {
        label: "NOT YET OPEN",
        tone: "sky",
        icon: CalendarClock,
        note: `Opens ${formatDateTime(quiz.available_from)}`,
      };
    }
    return { label: "MISSED", tone: "rose", icon: AlertTriangle, note: "Availability window closed" };
  }

  const remaining = Math.max(0, (quiz.attempts_allowed || 0) - (quiz.attempts_used || 0));
  const note = `${remaining} attempt${remaining === 1 ? "" : "s"} remaining`;
  if (attempt.is_passed === true) {
    return { label: "PASSED", tone: "emerald", icon: CheckCircle2, note };
  }
  if (attempt.is_passed === false) {
    return { label: "FAILED", tone: "rose", icon: XCircle, note };
  }
  return { label: attempt.status, tone: "stone", icon: CircleHelp, note };
}

function StatChip({ label, value, tone = "stone", isVault }) {
  const toneClasses = {
    stone: isVault
      ? "bg-white/5 border-stone-700 text-stone-300"
      : "bg-stone-50 border-stone-100 text-stone-700",
    amber: isVault
      ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
      : "bg-amber-50 border-amber-100 text-amber-800",
    emerald: isVault
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      : "bg-emerald-50 border-emerald-100 text-emerald-700",
  };
  return (
    <div
      className={`flex flex-col items-center rounded-xl border px-4 py-2.5 min-w-21 ${toneClasses[tone]}`}
    >
      <span className="text-base font-serif font-bold">{value}</span>
      <span className="text-[10px] font-mono uppercase tracking-wider mt-0.5 opacity-80">
        {label}
      </span>
    </div>
  );
}

function FilterButton({ active, onClick, isVault, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider border transition ${
        active
          ? isVault
            ? "bg-amber-600 border-amber-600 text-stone-950"
            : "bg-stone-900 border-stone-900 text-white"
          : isVault
            ? "bg-stone-900/60 border-stone-700 text-stone-400 hover:border-amber-600/50 hover:text-amber-400"
            : "bg-white border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-800"
      }`}
    >
      {children}
    </button>
  );
}

function QuizToDoRow({ quiz, isVault, onOpen }) {
  const meta = quizToDoMeta(quiz);
  const StatusIcon = meta.icon;
  const badgeClass = toneClass(meta.tone, isVault);
  const attempt = quiz.latest_attempt;
  const hasScore = attempt && attempt.percentage !== null && attempt.percentage !== undefined;
  const tone = hasScore ? scoreTone(attempt.percentage) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group w-full flex items-center gap-3 rounded-xl border transition p-3.5 text-left ${
        isVault
          ? "border-stone-800 bg-[#161412] hover:border-amber-700/50 hover:shadow-[0_8px_24px_-18px_rgba(0,0,0,0.6)]"
          : "border-stone-200 bg-white hover:border-amber-300 hover:shadow-[0_8px_24px_-18px_rgba(28,25,23,0.35)]"
      }`}
    >
      <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 border ${badgeClass}`}>
        <StatusIcon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] font-medium truncate ${isVault ? "text-stone-200" : "text-stone-800"}`}>
          {quiz.title}
        </span>
        <span
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-wider mt-1 ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          {quiz.module ? <span>{quiz.module.title}</span> : null}
          <span className="flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {quiz.attempts_used}/{quiz.attempts_allowed} attempts
          </span>
          <span>{meta.note}</span>
        </span>
      </span>
      <span className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 w-32">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${badgeClass}`}
        >
          {meta.label}
        </span>
        {hasScore ? (
          <span className={`text-xs font-mono font-bold ${isVault ? tone.textVault : tone.text}`}>
            {attempt.percentage}%
          </span>
        ) : null}
      </span>
      <span className="sm:hidden flex flex-col items-end gap-1 shrink-0">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${badgeClass}`}
        >
          {meta.label}
        </span>
      </span>
      <ChevronRight
        className={`w-4 h-4 transition shrink-0 ${
          isVault ? "text-stone-600 group-hover:text-amber-500" : "text-stone-300 group-hover:text-amber-600"
        }`}
      />
    </button>
  );
}

function QuizAttemptRow({ attempt, isVault, onOpen, isBest }) {
  const { label, tone, icon: StatusIcon } = attemptStatusMeta(attempt);
  const badgeClass = toneClass(tone, isVault);
  const canOpenDetail = Boolean(attempt.ended_at);
  const hasScore = attempt.percentage !== null && attempt.percentage !== undefined;
  const scoreToneValue = hasScore ? scoreTone(attempt.percentage) : null;

  return (
    <button
      type="button"
      onClick={canOpenDetail ? onOpen : undefined}
      disabled={!canOpenDetail}
      className={`group w-full flex items-center gap-3 rounded-xl border transition p-3.5 text-left disabled:opacity-70 disabled:cursor-default ${
        isVault
          ? "border-stone-800 bg-[#161412] enabled:hover:border-amber-700/50 enabled:hover:shadow-[0_8px_24px_-18px_rgba(0,0,0,0.6)]"
          : "border-stone-200 bg-white enabled:hover:border-amber-300 enabled:hover:shadow-[0_8px_24px_-18px_rgba(28,25,23,0.35)]"
      }`}
    >
      <span className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 border ${badgeClass}`}>
        <StatusIcon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={`block text-[13px] font-medium truncate ${isVault ? "text-stone-200" : "text-stone-800"}`}>
            {attempt.quiz.title}
          </span>
          {isBest ? (
            <span
              className={`flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 ${
                isVault
                  ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                  : "text-amber-700 bg-amber-50 border-amber-100"
              }`}
            >
              <Trophy className="w-3 h-3" /> Best
            </span>
          ) : null}
        </span>
        <span
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-wider mt-1 ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          {attempt.module ? <span>{attempt.module.title}</span> : null}
          <span className="flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            Attempt {attempt.attempt_number}
            {attempt.attempts_allowed ? `/${attempt.attempts_allowed}` : ""}
          </span>
          {attempt.ended_at ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDateTime(attempt.ended_at)}
            </span>
          ) : null}
        </span>
      </span>
      <span className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 w-28">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${badgeClass}`}
        >
          {label}
        </span>
        {hasScore ? (
          <span className="flex items-center gap-1.5 w-full">
            <span className={`flex-1 h-1.5 rounded-full overflow-hidden ${isVault ? "bg-white/10" : "bg-stone-100"}`}>
              <span
                className={`block h-full rounded-full ${scoreToneValue.bar}`}
                style={{ width: `${Math.min(100, Math.max(0, attempt.percentage))}%` }}
              />
            </span>
            <span className={`text-xs font-mono font-bold ${isVault ? scoreToneValue.textVault : scoreToneValue.text}`}>
              {attempt.percentage}%
            </span>
          </span>
        ) : null}
      </span>
      <span className="sm:hidden flex flex-col items-end gap-1 shrink-0">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${badgeClass}`}
        >
          {label}
        </span>
        {hasScore ? (
          <span className={`text-xs font-mono ${isVault ? "text-stone-400" : "text-stone-500"}`}>
            {attempt.score}/{attempt.total_marks} · {attempt.percentage}%
          </span>
        ) : null}
      </span>
      {canOpenDetail ? (
        <ChevronRight
          className={`w-4 h-4 transition shrink-0 ${
            isVault ? "text-stone-600 group-hover:text-amber-500" : "text-stone-300 group-hover:text-amber-600"
          }`}
        />
      ) : (
        <span className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}

export default function QuizzesTab() {
  const { isVault } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCourseId = searchParams.get("quizCourse");
  const [detailAttemptId, setDetailAttemptId] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  const enrollmentStatusByCourseId = useMemo(() => {
    const map = new Map();
    enrollments.forEach((enrollment) => {
      if (enrollment.course?.id) {
        map.set(enrollment.course.id, enrollment.status);
      }
    });
    return map;
  }, [enrollments]);

  const isLoading = isQuizzesLoading || isAttemptsLoading;
  const isError = isQuizzesError || isAttemptsError;
  const error = quizzesError || attemptsError;

  function refetch() {
    refetchQuizzes();
    refetchAttempts();
  }

  const quizGroupsByCourse = useMemo(() => {
    const map = new Map();
    quizzes.forEach((quiz) => {
      const courseId = quiz.course?.id;
      if (!courseId) return;
      const group = map.get(courseId) || { course: quiz.course, quizzes: [] };
      group.quizzes.push(quiz);
      map.set(courseId, group);
    });
    return Array.from(map.values()).map((group) => {
      const toDoQuizzes = sortToDoQuizzes(group.quizzes.filter(isToDoQuiz));
      const pendingCount = group.quizzes.filter(isPendingQuiz).length;
      const passedCount = group.quizzes.filter((quiz) => quiz.latest_attempt?.is_passed === true).length;
      const percentages = group.quizzes
        .map((quiz) => quiz.latest_attempt?.percentage)
        .filter((value) => value !== null && value !== undefined);
      const averagePercentage = percentages.length
        ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
        : null;
      return { ...group, toDoQuizzes, pendingCount, passedCount, averagePercentage };
    });
  }, [quizzes]);

  const attemptGroupsByCourse = useMemo(() => {
    const map = new Map();
    attempts.forEach((attempt) => {
      const courseId = attempt.course?.id;
      if (!courseId) return;
      const group = map.get(courseId) || { course: attempt.course, attempts: [] };
      group.attempts.push(attempt);
      map.set(courseId, group);
    });
    return Array.from(map.values()).map((group) => {
      const attemptsSorted = sortAttempts(group.attempts);
      const passedCount = attemptsSorted.filter((attempt) => attempt.is_passed === true).length;
      const percentages = attemptsSorted
        .map((attempt) => attempt.percentage)
        .filter((value) => value !== null && value !== undefined);
      const averagePercentage = percentages.length
        ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
        : null;
      return {
        ...group,
        attempts: attemptsSorted,
        passedCount,
        averagePercentage,
        bestAttemptIds: computeBestAttemptIds(attemptsSorted),
      };
    });
  }, [attempts]);

  const selectedGroup = useMemo(
    () =>
      selectedCourseId
        ? quizGroupsByCourse.find((item) => String(item.course.id) === String(selectedCourseId))
        : null,
    [quizGroupsByCourse, selectedCourseId]
  );

  const selectedAttemptGroup = useMemo(
    () =>
      (selectedCourseId &&
        attemptGroupsByCourse.find((item) => String(item.course.id) === String(selectedCourseId))) || {
        attempts: [],
        passedCount: 0,
        averagePercentage: null,
        bestAttemptIds: new Set(),
      },
    [attemptGroupsByCourse, selectedCourseId]
  );

  const canInteractWithSelectedCourse =
    selectedGroup && enrollmentStatusByCourseId.get(selectedGroup.course.id) === "ACTIVE";

  const filteredAttempts = useMemo(() => {
    const list = selectedAttemptGroup.attempts;
    if (statusFilter === "ALL") return list;
    if (statusFilter === "IN_PROGRESS") {
      return list.filter((attempt) => attempt.status === "IN_PROGRESS");
    }
    if (statusFilter === "ABANDONED") {
      return list.filter(isAbandonedStatus);
    }
    if (statusFilter === "PASSED") {
      return list.filter((attempt) => attempt.is_passed === true);
    }
    return list.filter((attempt) => attempt.is_passed === false && !isAbandonedStatus(attempt));
  }, [selectedAttemptGroup, statusFilter]);

  function openCourse(courseId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("quizCourse", String(courseId));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setStatusFilter("ALL");
  }

  function closeCourse() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("quizCourse");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  let content;

  if (isLoading) {
    content = (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading your quizzes..." />
      </div>
    );
  } else if (isError) {
    content = (
      <div
        className={`border rounded-2xl p-8 text-center max-w-lg mx-auto ${
          isVault ? "border-stone-800 bg-[#161412]" : "border-stone-200 bg-white"
        }`}
      >
        <div
          className={`w-12 h-12 border rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isVault
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-rose-50 border-rose-100 text-rose-600"
          }`}
        >
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className={`text-xl font-serif font-bold mb-2 ${isVault ? "text-stone-50" : "text-stone-900"}`}>
          Failed to Load Quizzes
        </h2>
        <p className={`text-sm font-light mb-6 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          {getApiErrorMessage(error, "Unable to load your quizzes.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className={`inline-flex items-center gap-2 px-5 py-3 font-bold font-mono text-sm uppercase tracking-wider rounded-xl transition ${
            isVault
              ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
              : "bg-stone-900 hover:bg-stone-800 text-stone-100"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  } else if (quizzes.length === 0) {
    content = (
      <div
        className={`rounded-2xl border border-dashed ${
          isVault ? "border-stone-700 bg-[#161412]/70" : "border-stone-200 bg-white/70"
        }`}
      >
        <EmptyState
          icon={CircleHelp}
          label="No quizzes yet"
          description="Once your instructors publish quizzes in your enrolled courses, they will appear here."
          size="lg"
        />
      </div>
    );
  } else if (selectedCourseId) {
    if (!selectedGroup) {
      content = (
        <div
          className={`rounded-2xl border border-dashed p-10 text-center space-y-4 ${
            isVault ? "border-stone-700 bg-[#161412]/70" : "border-stone-200 bg-white/70"
          }`}
        >
          <p className={`text-sm ${isVault ? "text-stone-400" : "text-stone-500"}`}>
            We couldn&apos;t find quizzes for that course.
          </p>
          <button
            type="button"
            onClick={closeCourse}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-mono uppercase tracking-wider rounded-xl transition ${
              isVault
                ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                : "bg-stone-900 hover:bg-stone-800 text-white"
            }`}
          >
            Back to Quizzes
          </button>
        </div>
      );
    } else {
      const inProgressCount = selectedAttemptGroup.attempts.filter(
        (attempt) => attempt.status === "IN_PROGRESS"
      ).length;
      const abandonedCount = selectedAttemptGroup.attempts.filter(isAbandonedStatus).length;
      const failedCount = selectedAttemptGroup.attempts.filter(
        (attempt) => attempt.is_passed === false && !isAbandonedStatus(attempt)
      ).length;

      content = (
        <div className="space-y-6">
          <button
            type="button"
            onClick={closeCourse}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs font-mono uppercase tracking-wider rounded-xl transition ${
              isVault
                ? "border-stone-700 hover:border-amber-600/50 hover:text-amber-400 text-stone-400"
                : "border-stone-200 hover:border-amber-300 hover:text-amber-800 text-stone-600"
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Quizzes
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className={`font-serif font-bold text-2xl ${isVault ? "text-stone-50" : "text-stone-900"}`}>
                {selectedGroup.course.title}
              </h2>
              <p className={`text-sm font-light mt-1 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
                {selectedGroup.quizzes.length} quiz{selectedGroup.quizzes.length === 1 ? "" : "zes"} total
                {!canInteractWithSelectedCourse
                  ? " · enrollment isn't active, attempts are disabled"
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <StatChip
                label="To do"
                value={selectedGroup.pendingCount}
                tone={selectedGroup.pendingCount > 0 ? "amber" : "stone"}
                isVault={isVault}
              />
              <StatChip label="Passed" value={selectedGroup.passedCount} tone="emerald" isVault={isVault} />
              <StatChip
                label="Avg score"
                value={
                  selectedGroup.averagePercentage === null ? "—" : `${selectedGroup.averagePercentage}%`
                }
                tone="amber"
                isVault={isVault}
              />
            </div>
          </div>

          {selectedGroup.toDoQuizzes.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-baseline gap-2">
                <h3 className={`text-sm font-mono font-bold uppercase tracking-wider ${isVault ? "text-stone-300" : "text-stone-600"}`}>
                  To do
                </h3>
                <span className={`text-[11px] font-mono ${isVault ? "text-stone-500" : "text-stone-400"}`}>
                  Quizzes you can take right now
                </span>
              </div>
              <div className="space-y-2.5">
                {selectedGroup.toDoQuizzes.map((quiz) => (
                  <QuizToDoRow
                    key={quiz.id}
                    quiz={quiz}
                    isVault={isVault}
                    onOpen={() => setSelectedQuiz(quiz)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2.5">
            <div className="flex items-baseline gap-2">
              <h3 className={`text-sm font-mono font-bold uppercase tracking-wider ${isVault ? "text-stone-300" : "text-stone-600"}`}>
                Attempt history
              </h3>
              <span className={`text-[11px] font-mono ${isVault ? "text-stone-500" : "text-stone-400"}`}>
                Every attempt you&apos;ve made in this course
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((filter) => {
                const count =
                  filter.id === "ALL"
                    ? selectedAttemptGroup.attempts.length
                    : filter.id === "PASSED"
                      ? selectedAttemptGroup.passedCount
                      : filter.id === "FAILED"
                        ? failedCount
                        : filter.id === "ABANDONED"
                          ? abandonedCount
                          : inProgressCount;
                return (
                  <FilterButton
                    key={filter.id}
                    active={statusFilter === filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    isVault={isVault}
                  >
                    {filter.label} ({count})
                  </FilterButton>
                );
              })}
            </div>
            {filteredAttempts.length === 0 ? (
              <div
                className={`rounded-2xl border border-dashed ${
                  isVault ? "border-stone-700 bg-[#161412]/70" : "border-stone-200 bg-white/70"
                }`}
              >
                <EmptyState
                  icon={CircleHelp}
                  label="Nothing here"
                  description="No attempts match this filter."
                  compact
                  size="lg"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredAttempts.map((attempt) => (
                  <QuizAttemptRow
                    key={attempt.attempt_id}
                    attempt={attempt}
                    isVault={isVault}
                    isBest={selectedAttemptGroup.bestAttemptIds.has(attempt.attempt_id)}
                    onOpen={() => setDetailAttemptId(attempt.attempt_id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
  } else {
    content = (
      <div className="space-y-6">
        <div>
          <p
            className={`text-[11px] font-mono uppercase tracking-[0.2em] mb-2 ${
              isVault ? "text-amber-500" : "text-amber-700/80"
            }`}
          >
            Assessments
          </p>
          <h2 className={`font-serif font-bold text-2xl sm:text-3xl ${isVault ? "text-stone-50" : "text-stone-900"}`}>
            Your quizzes
          </h2>
          <p className={`text-sm font-light mt-2 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
            Grouped by course — open a course to take a pending quiz or review every attempt and
            score.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {quizGroupsByCourse.map((group) => (
            <CourseworkSummaryCard
              key={group.course.id}
              courseTitle={group.course.title}
              accent="violet"
              itemLabel="quiz"
              totalCount={group.quizzes.length}
              pendingCount={group.pendingCount}
              completedCount={group.passedCount}
              completedLabel="Passed"
              averagePercentage={group.averagePercentage}
              isVault={isVault}
              onOpen={() => openCourse(group.course.id)}
            />
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {content}
      <QuizAttemptModal
        quiz={selectedQuiz}
        canInteract={Boolean(canInteractWithSelectedCourse)}
        onClose={() => setSelectedQuiz(null)}
      />
      <QuizAttemptHistoryModal attemptId={detailAttemptId} onClose={() => setDetailAttemptId(null)} />
    </>
  );
}
