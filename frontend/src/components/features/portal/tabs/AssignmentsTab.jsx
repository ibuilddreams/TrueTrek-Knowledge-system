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
  Clock,
  ClipboardList,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { motion } from "motion/react";
import { useStudentAssignments } from "@/hooks/student/useStudentAssignments";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import { useTheme } from "@/hooks/useTheme";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import AssignmentDetailModal from "../course-detail/AssignmentDetailModal";
import CourseworkSummaryCard from "../CourseworkSummaryCard";

const STATUS_STYLES = {
  DRAFT: "bg-stone-50 text-stone-500 border-stone-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
  LATE: "bg-rose-50 text-rose-600 border-rose-100",
  GRADED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  RETURNED: "bg-sky-50 text-sky-700 border-sky-100",
  RESUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
};

const STATUS_STYLES_VAULT = {
  DRAFT: "bg-stone-500/10 text-stone-400 border-stone-500/20",
  SUBMITTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LATE: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  GRADED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  RETURNED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  RESUBMITTED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const STATUS_ICON = {
  DRAFT: Clock,
  SUBMITTED: Clock,
  LATE: AlertTriangle,
  GRADED: CheckCircle2,
  RETURNED: RotateCcw,
  RESUBMITTED: RefreshCw,
};

const NOT_SUBMITTED_STYLE = "bg-stone-50 text-stone-500 border-stone-200";
const NOT_SUBMITTED_STYLE_VAULT = "bg-stone-500/10 text-stone-400 border-stone-500/20";
const OVERDUE_STYLE = "bg-rose-50 text-rose-600 border-rose-100";
const OVERDUE_STYLE_VAULT = "bg-rose-500/10 text-rose-400 border-rose-500/20";

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

const STATUS_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PENDING", label: "To Do" },
  { id: "SUBMITTED", label: "Awaiting Grading" },
  { id: "GRADED", label: "Graded" },
];

function sortAssignments(list) {
  const pending = list.filter((assignment) => !assignment.submission);
  const submitted = list.filter((assignment) => assignment.submission);

  pending.sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
  );
  submitted.sort((a, b) => {
    const at = a.submission.submitted_at
      ? new Date(a.submission.submitted_at).getTime()
      : 0;
    const bt = b.submission.submitted_at
      ? new Date(b.submission.submitted_at).getTime()
      : 0;
    return bt - at;
  });

  return [...pending, ...submitted];
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

function AssignmentRow({ assignment, isVault, onOpen }) {
  const submission = assignment.submission;
  const hasSubmission = Boolean(submission);
  const isGraded = hasSubmission && submission.marks !== null;
  const isOverdue = !hasSubmission && assignment.is_overdue;

  const statusClass = hasSubmission
    ? isVault
      ? STATUS_STYLES_VAULT[submission.status] || STATUS_STYLES_VAULT.DRAFT
      : STATUS_STYLES[submission.status] || STATUS_STYLES.DRAFT
    : isOverdue
      ? isVault
        ? OVERDUE_STYLE_VAULT
        : OVERDUE_STYLE
      : isVault
        ? NOT_SUBMITTED_STYLE_VAULT
        : NOT_SUBMITTED_STYLE;
  const StatusIcon = hasSubmission
    ? STATUS_ICON[submission.status] || ClipboardList
    : isOverdue
      ? AlertTriangle
      : Clock;
  const statusLabel = hasSubmission
    ? submission.status
    : isOverdue
      ? "OVERDUE"
      : "NOT SUBMITTED";
  const gradingLabel = hasSubmission
    ? isGraded
      ? "Graded"
      : "Pending review"
    : isOverdue
      ? "Past due"
      : "Awaiting submission";
  const tone = isGraded ? scoreTone(submission.percentage) : null;

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
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 border ${statusClass}`}
      >
        <StatusIcon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[13px] font-medium truncate ${
            isVault ? "text-stone-200" : "text-stone-800"
          }`}
        >
          {assignment.title}
        </span>
        <span
          className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono uppercase tracking-wider mt-1 ${
            isVault ? "text-stone-500" : "text-stone-400"
          }`}
        >
          {assignment.module ? <span>{assignment.module.title}</span> : null}
          {hasSubmission && submission.submitted_at ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{" "}
              {formatDateTime(submission.submitted_at)}
            </span>
          ) : !hasSubmission ? (
            <span className="flex items-center gap-1">
              <CalendarClock className="w-3 h-3" />
              Due {formatDateTime(assignment.due_date)}
            </span>
          ) : null}
          <span>{gradingLabel}</span>
        </span>
      </span>
      <span className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 w-28">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${statusClass}`}
        >
          {statusLabel}
        </span>
        {isGraded ? (
          <span className="flex items-center gap-1.5 w-full">
            <span className={`flex-1 h-1.5 rounded-full overflow-hidden ${isVault ? "bg-white/10" : "bg-stone-100"}`}>
              <span
                className={`block h-full rounded-full ${tone.bar}`}
                style={{
                  width: `${Math.min(100, Math.max(0, submission.percentage ?? 0))}%`,
                }}
              />
            </span>
            <span className={`text-xs font-mono font-bold ${isVault ? tone.textVault : tone.text}`}>
              {submission.marks}/{assignment.total_marks}
            </span>
          </span>
        ) : null}
      </span>
      <span className="sm:hidden flex flex-col items-end gap-1 shrink-0">
        <span
          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${statusClass}`}
        >
          {statusLabel}
        </span>
        {isGraded ? (
          <span className={`text-xs font-mono ${isVault ? "text-stone-400" : "text-stone-500"}`}>
            {submission.marks}/{assignment.total_marks}
            {submission.percentage !== null
              ? ` · ${submission.percentage}%`
              : ""}
          </span>
        ) : null}
      </span>
      <ChevronRight
        className={`w-4 h-4 transition shrink-0 ${
          isVault
            ? "text-stone-600 group-hover:text-amber-500"
            : "text-stone-300 group-hover:text-amber-600"
        }`}
      />
    </button>
  );
}

export default function AssignmentsTab() {
  const { isVault } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedCourseId = searchParams.get("assignmentCourse");
  const [detailAssignment, setDetailAssignment] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useStudentAssignments();

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

  const groupsByCourse = useMemo(() => {
    const map = new Map();
    assignments.forEach((assignment) => {
      const courseId = assignment.course?.id;
      if (!courseId) return;
      const group = map.get(courseId) || {
        course: assignment.course,
        assignments: [],
      };
      group.assignments.push(assignment);
      map.set(courseId, group);
    });
    return Array.from(map.values()).map((group) => {
      const assignmentsSorted = sortAssignments(group.assignments);
      const pendingCount = assignmentsSorted.filter(
        (assignment) => !assignment.submission,
      ).length;
      const awaitingCount = assignmentsSorted.filter(
        (assignment) =>
          assignment.submission && assignment.submission.marks === null,
      ).length;
      const gradedCount = assignmentsSorted.filter(
        (assignment) =>
          assignment.submission && assignment.submission.marks !== null,
      ).length;
      const percentages = assignmentsSorted
        .map((assignment) => assignment.submission?.percentage)
        .filter((value) => value !== null && value !== undefined);
      const averagePercentage = percentages.length
        ? Math.round(
            percentages.reduce((sum, value) => sum + value, 0) /
              percentages.length,
          )
        : null;
      return {
        ...group,
        assignments: assignmentsSorted,
        pendingCount,
        awaitingCount,
        gradedCount,
        averagePercentage,
      };
    });
  }, [assignments]);

  const selectedGroup = useMemo(
    () =>
      selectedCourseId
        ? groupsByCourse.find(
            (item) => String(item.course.id) === String(selectedCourseId),
          )
        : null,
    [groupsByCourse, selectedCourseId],
  );

  const canInteractWithSelectedCourse =
    selectedGroup &&
    enrollmentStatusByCourseId.get(selectedGroup.course.id) === "ACTIVE";

  const filteredAssignments = useMemo(() => {
    if (!selectedGroup) return [];
    if (statusFilter === "PENDING") {
      return selectedGroup.assignments.filter((a) => !a.submission);
    }
    if (statusFilter === "SUBMITTED") {
      return selectedGroup.assignments.filter(
        (a) => a.submission && a.submission.marks === null,
      );
    }
    if (statusFilter === "GRADED") {
      return selectedGroup.assignments.filter(
        (a) => a.submission && a.submission.marks !== null,
      );
    }
    return selectedGroup.assignments;
  }, [selectedGroup, statusFilter]);

  function openCourse(courseId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("assignmentCourse", String(courseId));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setStatusFilter("ALL");
  }

  function closeCourse() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("assignmentCourse");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  let content;

  if (isLoading) {
    content = (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        aria-busy="true"
      >
        <Loader fullScreen={false} label="Loading your assignments..." />
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
          Failed to Load Assignments
        </h2>
        <p className={`text-sm font-light mb-6 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
          {getApiErrorMessage(error, "Unable to load your assignments.")}
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
  } else if (assignments.length === 0) {
    content = (
      <div
        className={`rounded-2xl border border-dashed ${
          isVault ? "border-stone-700 bg-[#161412]/70" : "border-stone-200 bg-white/70"
        }`}
      >
        <EmptyState
          icon={ClipboardList}
          label="No assignments yet"
          description="Once your instructors publish assignments in your enrolled courses, they will appear here."
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
            We couldn&apos;t find assignments for that course.
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
            Back to Assignments
          </button>
        </div>
      );
    } else {
      const { pendingCount, awaitingCount, gradedCount } = selectedGroup;

      content = (
        <div className="space-y-5">
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
            Back to Assignments
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className={`font-serif font-bold text-2xl ${isVault ? "text-stone-50" : "text-stone-900"}`}>
                {selectedGroup.course.title}
              </h2>
              <p className={`text-sm font-light mt-1 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
                {selectedGroup.assignments.length} assignment
                {selectedGroup.assignments.length === 1 ? "" : "s"} total
                {!canInteractWithSelectedCourse
                  ? " · enrollment isn't active, submissions are disabled"
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <StatChip
                label="To do"
                value={pendingCount}
                tone={pendingCount > 0 ? "amber" : "stone"}
                isVault={isVault}
              />
              <StatChip label="Graded" value={gradedCount} tone="emerald" isVault={isVault} />
              <StatChip
                label="Avg score"
                value={
                  selectedGroup.averagePercentage === null
                    ? "—"
                    : `${selectedGroup.averagePercentage}%`
                }
                tone="amber"
                isVault={isVault}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.id === "ALL"
                  ? selectedGroup.assignments.length
                  : filter.id === "PENDING"
                    ? pendingCount
                    : filter.id === "SUBMITTED"
                      ? awaitingCount
                      : gradedCount;
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
          {filteredAssignments.length === 0 ? (
            <div
              className={`rounded-2xl border border-dashed ${
                isVault ? "border-stone-700 bg-[#161412]/70" : "border-stone-200 bg-white/70"
              }`}
            >
              <EmptyState
                icon={ClipboardList}
                label="Nothing here"
                description="No assignments match this filter."
                compact
                size="lg"
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAssignments.map((assignment) => (
                <AssignmentRow
                  key={assignment.id}
                  assignment={assignment}
                  isVault={isVault}
                  onOpen={() => setDetailAssignment(assignment)}
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
          <p
            className={`text-[11px] font-mono uppercase tracking-[0.2em] mb-2 ${
              isVault ? "text-amber-500" : "text-amber-700/80"
            }`}
          >
            Coursework
          </p>
          <h2 className={`font-serif font-bold text-2xl sm:text-3xl ${isVault ? "text-stone-50" : "text-stone-900"}`}>
            Your assignments
          </h2>
          <p className={`text-sm font-light mt-2 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
            Grouped by course — open a course to submit pending work or review
            past submissions, marks, and feedback.
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {groupsByCourse.map((group) => (
            <CourseworkSummaryCard
              key={group.course.id}
              courseTitle={group.course.title}
              accent="amber"
              itemLabel="assignment"
              totalCount={group.assignments.length}
              pendingCount={group.pendingCount}
              completedCount={group.gradedCount}
              completedLabel="Graded"
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
      <AssignmentDetailModal
        assignment={detailAssignment}
        canInteract={Boolean(canInteractWithSelectedCourse)}
        onClose={() => setDetailAssignment(null)}
      />
    </>
  );
}
