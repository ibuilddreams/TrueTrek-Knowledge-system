"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
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
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import QuizAttemptHistoryModal from "../history/QuizAttemptHistoryModal";

const SCORE_TONES = {
  high: { bar: "bg-emerald-500", text: "text-emerald-700" },
  mid: { bar: "bg-amber-500", text: "text-amber-700" },
  low: { bar: "bg-rose-500", text: "text-rose-600" },
};

function scoreTone(percentage) {
  if (percentage >= 70) return SCORE_TONES.high;
  if (percentage >= 50) return SCORE_TONES.mid;
  return SCORE_TONES.low;
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
    return {
      label: "In progress",
      className: "bg-amber-50 text-amber-700 border-amber-100",
      icon: Clock,
    };
  }
  if (attempt.status === "EXPIRED") {
    return {
      label: "Expired",
      className: "bg-orange-50 text-orange-700 border-orange-100",
      icon: AlertTriangle,
    };
  }
  if (attempt.status === "ABANDONED") {
    return {
      label: "Abandoned",
      className: "bg-stone-100 text-stone-600 border-stone-200",
      icon: AlertTriangle,
    };
  }
  if (attempt.is_passed === true) {
    return {
      label: "Passed",
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
      icon: CheckCircle2,
    };
  }
  if (attempt.is_passed === false) {
    return {
      label: "Failed",
      className: "bg-rose-50 text-rose-600 border-rose-100",
      icon: XCircle,
    };
  }
  return {
    label: attempt.status,
    className: "bg-stone-50 text-stone-500 border-stone-200",
    icon: CircleHelp,
  };
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

function StatChip({ label, value, tone = "stone" }) {
  const toneClasses = {
    stone: "bg-stone-50 border-stone-100 text-stone-700",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  };
  return (
    <div
      className={`flex flex-col items-center rounded-xl border px-4 py-2.5 min-w-21 ${toneClasses[tone]}`}
    >
      <span className="text-base font-serif font-bold">{value}</span>
      <span className="text-[9px] font-mono uppercase tracking-wider mt-0.5 opacity-80">
        {label}
      </span>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition ${
        active
          ? "bg-stone-900 border-stone-900 text-white"
          : "bg-white border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-800"
      }`}
    >
      {children}
    </button>
  );
}

function CourseSummaryCard({ courseTitle, attemptsCount, passedCount, averagePercentage, onOpen }) {
  const tone = averagePercentage === null ? null : scoreTone(averagePercentage);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full text-left rounded-2xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-[0_10px_30px_-20px_rgba(28,25,23,0.35)] transition p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">Course</p>
          <h3 className="font-serif font-bold text-stone-900 mt-0.5 truncate">{courseTitle}</h3>
        </div>
        <span className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 flex items-center justify-center shrink-0">
          <CircleHelp className="w-4 h-4" />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-serif font-bold text-stone-900">{attemptsCount}</p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            Attempts
          </p>
        </div>
        <div>
          <p className="text-lg font-serif font-bold text-stone-900">{passedCount}</p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            Passed
          </p>
        </div>
        <div>
          <p className="text-lg font-serif font-bold text-amber-800">
            {averagePercentage === null ? "—" : `${averagePercentage}%`}
          </p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            Avg score
          </p>
        </div>
      </div>
      {tone ? (
        <div className="h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${tone.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, averagePercentage))}%` }}
          />
        </div>
      ) : null}
      <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 group-hover:text-amber-700 transition">
        View attempts
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

function QuizAttemptRow({ attempt, onOpen, isBest }) {
  const { label, className, icon: StatusIcon } = attemptStatusMeta(attempt);
  const canOpenDetail = Boolean(attempt.ended_at);
  const hasScore = attempt.percentage !== null && attempt.percentage !== undefined;
  const tone = hasScore ? scoreTone(attempt.percentage) : null;

  return (
    <button
      type="button"
      onClick={canOpenDetail ? onOpen : undefined}
      disabled={!canOpenDetail}
      className="group w-full flex items-center gap-3 rounded-xl border border-stone-200 bg-white enabled:hover:border-amber-300 enabled:hover:shadow-[0_8px_24px_-18px_rgba(28,25,23,0.35)] disabled:opacity-70 disabled:cursor-default transition p-3.5 text-left"
    >
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 border ${className}`}
      >
        <StatusIcon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="block text-[13px] font-medium text-stone-800 truncate">
            {attempt.quiz.title}
          </span>
          {isBest ? (
            <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md shrink-0">
              <Trophy className="w-3 h-3" /> Best
            </span>
          ) : null}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-1">
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
          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${className}`}
        >
          {label}
        </span>
        {hasScore ? (
          <span className="flex items-center gap-1.5 w-full">
            <span className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <span
                className={`block h-full rounded-full ${tone.bar}`}
                style={{ width: `${Math.min(100, Math.max(0, attempt.percentage))}%` }}
              />
            </span>
            <span className={`text-[11px] font-mono font-bold ${tone.text}`}>
              {attempt.percentage}%
            </span>
          </span>
        ) : null}
      </span>
      <span className="sm:hidden flex flex-col items-end gap-1 shrink-0">
        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${className}`}
        >
          {label}
        </span>
        {hasScore ? (
          <span className="text-[11px] font-mono text-stone-500">
            {attempt.score}/{attempt.total_marks} · {attempt.percentage}%
          </span>
        ) : null}
      </span>
      {canOpenDetail ? (
        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition shrink-0" />
      ) : (
        <span className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
}

export default function QuizzesTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCourseId = searchParams.get("quizCourse");
  const [detailAttemptId, setDetailAttemptId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const {
    data: attempts = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useStudentQuizAttempts();

  const groupsByCourse = useMemo(() => {
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
        ? groupsByCourse.find((item) => String(item.course.id) === String(selectedCourseId))
        : null,
    [groupsByCourse, selectedCourseId]
  );

  const filteredAttempts = useMemo(() => {
    if (!selectedGroup) return [];
    if (statusFilter === "ALL") return selectedGroup.attempts;
    if (statusFilter === "IN_PROGRESS") {
      return selectedGroup.attempts.filter((attempt) => attempt.status === "IN_PROGRESS");
    }
    if (statusFilter === "ABANDONED") {
      return selectedGroup.attempts.filter(isAbandonedStatus);
    }
    if (statusFilter === "PASSED") {
      return selectedGroup.attempts.filter((attempt) => attempt.is_passed === true);
    }
    return selectedGroup.attempts.filter(
      (attempt) => attempt.is_passed === false && !isAbandonedStatus(attempt)
    );
  }, [selectedGroup, statusFilter]);

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
        <Loader fullScreen={false} label="Loading your quiz attempts..." />
      </div>
    );
  } else if (isError) {
    content = (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
          Failed to Load Quiz Attempts
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">
          {getApiErrorMessage(error, "Unable to load your quiz attempts.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  } else if (attempts.length === 0) {
    content = (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
        <EmptyState
          icon={CircleHelp}
          label="No quiz attempts yet"
          description="Once you attempt a quiz in any of your courses, it will appear here."
        />
      </div>
    );
  } else if (selectedCourseId) {
    if (!selectedGroup) {
      content = (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70 p-10 text-center space-y-4">
          <p className="text-sm text-stone-500">
            We couldn&apos;t find quiz attempts for that course.
          </p>
          <button
            type="button"
            onClick={closeCourse}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono uppercase tracking-wider rounded-xl transition"
          >
            Back to Quizzes
          </button>
        </div>
      );
    } else {
      const inProgressCount = selectedGroup.attempts.filter(
        (attempt) => attempt.status === "IN_PROGRESS"
      ).length;
      const abandonedCount = selectedGroup.attempts.filter(isAbandonedStatus).length;
      const failedCount = selectedGroup.attempts.filter(
        (attempt) => attempt.is_passed === false && !isAbandonedStatus(attempt)
      ).length;

      content = (
        <div className="space-y-5">
          <button
            type="button"
            onClick={closeCourse}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:border-amber-300 hover:text-amber-800 text-stone-600 text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Quizzes
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-serif font-bold text-2xl text-stone-900">
                {selectedGroup.course.title}
              </h2>
              <p className="text-xs text-stone-500 font-light mt-1">
                {selectedGroup.attempts.length} quiz attempt
                {selectedGroup.attempts.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <StatChip label="Passed" value={selectedGroup.passedCount} tone="emerald" />
              <StatChip
                label="Avg score"
                value={
                  selectedGroup.averagePercentage === null
                    ? "—"
                    : `${selectedGroup.averagePercentage}%`
                }
                tone="amber"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.id === "ALL"
                  ? selectedGroup.attempts.length
                  : filter.id === "PASSED"
                    ? selectedGroup.passedCount
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
                >
                  {filter.label} ({count})
                </FilterButton>
              );
            })}
          </div>
          {filteredAttempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
              <EmptyState
                icon={CircleHelp}
                label="Nothing here"
                description="No attempts match this filter."
                compact
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAttempts.map((attempt) => (
                <QuizAttemptRow
                  key={attempt.attempt_id}
                  attempt={attempt}
                  isBest={selectedGroup.bestAttemptIds.has(attempt.attempt_id)}
                  onOpen={() => setDetailAttemptId(attempt.attempt_id)}
                />
              ))}
            </div>
          )}
        </div>
      );
    }
  } else {
    content = (
      <div className="space-y-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700/80 mb-2">
            Attempt history
          </p>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Your quiz attempts
          </h2>
          <p className="text-sm text-stone-500 font-light mt-2">
            Grouped by course — open a course to review every attempt and score.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {groupsByCourse.map((group) => (
            <CourseSummaryCard
              key={group.course.id}
              courseTitle={group.course.title}
              attemptsCount={group.attempts.length}
              passedCount={group.passedCount}
              averagePercentage={group.averagePercentage}
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
      <QuizAttemptHistoryModal
        attemptId={detailAttemptId}
        onClose={() => setDetailAttemptId(null)}
      />
    </>
  );
}
