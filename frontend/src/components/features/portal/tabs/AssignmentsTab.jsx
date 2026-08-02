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
  Clock,
  ClipboardList,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { motion } from "motion/react";
import { useStudentAssignments } from "@/hooks/student/useStudentAssignments";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDateTime } from "@/lib/adminFormatters";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import AssignmentSubmissionDetailModal from "../history/AssignmentSubmissionDetailModal";

const STATUS_STYLES = {
  DRAFT: "bg-stone-50 text-stone-500 border-stone-200",
  SUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
  LATE: "bg-rose-50 text-rose-600 border-rose-100",
  GRADED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  RETURNED: "bg-sky-50 text-sky-700 border-sky-100",
  RESUBMITTED: "bg-amber-50 text-amber-700 border-amber-100",
};

const STATUS_ICON = {
  DRAFT: Clock,
  SUBMITTED: Clock,
  LATE: AlertTriangle,
  GRADED: CheckCircle2,
  RETURNED: RotateCcw,
  RESUBMITTED: RefreshCw,
};

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
  { id: "GRADED", label: "Graded" },
  { id: "PENDING", label: "Pending" },
];

function sortAssignments(list) {
  return [...list].sort((a, b) => {
    const at = a.submission.submitted_at ? new Date(a.submission.submitted_at).getTime() : 0;
    const bt = b.submission.submitted_at ? new Date(b.submission.submitted_at).getTime() : 0;
    return bt - at;
  });
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

function CourseSummaryCard({ courseTitle, submittedCount, gradedCount, averagePercentage, onOpen }) {
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
        <span className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <ClipboardList className="w-4 h-4" />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-serif font-bold text-stone-900">{submittedCount}</p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            Submitted
          </p>
        </div>
        <div>
          <p className="text-lg font-serif font-bold text-stone-900">{gradedCount}</p>
          <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400 mt-0.5">
            Graded
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
        View submissions
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

function AssignmentHistoryRow({ assignment, onOpen }) {
  const submission = assignment.submission;
  const isGraded = submission.marks !== null;
  const gradingLabel = isGraded ? "Graded" : "Pending review";
  const statusClass = STATUS_STYLES[submission.status] || STATUS_STYLES.DRAFT;
  const StatusIcon = STATUS_ICON[submission.status] || ClipboardList;
  const tone = isGraded ? scoreTone(submission.percentage) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group w-full flex items-center gap-3 rounded-xl border border-stone-200 bg-white hover:border-amber-300 hover:shadow-[0_8px_24px_-18px_rgba(28,25,23,0.35)] transition p-3.5 text-left"
    >
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 border ${statusClass}`}
      >
        <StatusIcon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-stone-800 truncate">
          {assignment.title}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-mono uppercase tracking-wider text-stone-400 mt-1">
          {assignment.module ? <span>{assignment.module.title}</span> : null}
          {submission.submitted_at ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDateTime(submission.submitted_at)}
            </span>
          ) : null}
          <span>{gradingLabel}</span>
        </span>
      </span>
      <span className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 w-28">
        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${statusClass}`}
        >
          {submission.status}
        </span>
        {isGraded ? (
          <span className="flex items-center gap-1.5 w-full">
            <span className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
              <span
                className={`block h-full rounded-full ${tone.bar}`}
                style={{ width: `${Math.min(100, Math.max(0, submission.percentage ?? 0))}%` }}
              />
            </span>
            <span className={`text-[11px] font-mono font-bold ${tone.text}`}>
              {submission.marks}/{assignment.total_marks}
            </span>
          </span>
        ) : null}
      </span>
      <span className="sm:hidden flex flex-col items-end gap-1 shrink-0">
        <span
          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${statusClass}`}
        >
          {submission.status}
        </span>
        {isGraded ? (
          <span className="text-[11px] font-mono text-stone-500">
            {submission.marks}/{assignment.total_marks}
            {submission.percentage !== null ? ` · ${submission.percentage}%` : ""}
          </span>
        ) : null}
      </span>
      <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 transition shrink-0" />
    </button>
  );
}

export default function AssignmentsTab() {
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

  const submittedAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.submission),
    [assignments]
  );

  const groupsByCourse = useMemo(() => {
    const map = new Map();
    submittedAssignments.forEach((assignment) => {
      const courseId = assignment.course?.id;
      if (!courseId) return;
      const group = map.get(courseId) || { course: assignment.course, assignments: [] };
      group.assignments.push(assignment);
      map.set(courseId, group);
    });
    return Array.from(map.values()).map((group) => {
      const assignmentsSorted = sortAssignments(group.assignments);
      const gradedCount = assignmentsSorted.filter(
        (assignment) => assignment.submission.marks !== null
      ).length;
      const percentages = assignmentsSorted
        .map((assignment) => assignment.submission.percentage)
        .filter((value) => value !== null && value !== undefined);
      const averagePercentage = percentages.length
        ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / percentages.length)
        : null;
      return { ...group, assignments: assignmentsSorted, gradedCount, averagePercentage };
    });
  }, [submittedAssignments]);

  const selectedGroup = useMemo(
    () =>
      selectedCourseId
        ? groupsByCourse.find((item) => String(item.course.id) === String(selectedCourseId))
        : null,
    [groupsByCourse, selectedCourseId]
  );

  const filteredAssignments = useMemo(() => {
    if (!selectedGroup) return [];
    if (statusFilter === "GRADED") {
      return selectedGroup.assignments.filter((a) => a.submission.marks !== null);
    }
    if (statusFilter === "PENDING") {
      return selectedGroup.assignments.filter((a) => a.submission.marks === null);
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
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  let content;

  if (isLoading) {
    content = (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} label="Loading your assignments..." />
      </div>
    );
  } else if (isError) {
    content = (
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
          Failed to Load Assignments
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">
          {getApiErrorMessage(error, "Unable to load your submitted assignments.")}
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
  } else if (submittedAssignments.length === 0) {
    content = (
      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
        <EmptyState
          icon={ClipboardList}
          label="No submitted assignments yet"
          description="Once you submit an assignment in any of your courses, it will appear here."
        />
      </div>
    );
  } else if (selectedCourseId) {
    if (!selectedGroup) {
      content = (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70 p-10 text-center space-y-4">
          <p className="text-sm text-stone-500">
            We couldn&apos;t find submissions for that course.
          </p>
          <button
            type="button"
            onClick={closeCourse}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-mono uppercase tracking-wider rounded-xl transition"
          >
            Back to Assignments
          </button>
        </div>
      );
    } else {
      const gradedCount = selectedGroup.gradedCount;
      const pendingCount = selectedGroup.assignments.length - gradedCount;

      content = (
        <div className="space-y-5">
          <button
            type="button"
            onClick={closeCourse}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-stone-200 hover:border-amber-300 hover:text-amber-800 text-stone-600 text-[11px] font-mono uppercase tracking-wider rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Assignments
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-serif font-bold text-2xl text-stone-900">
                {selectedGroup.course.title}
              </h2>
              <p className="text-xs text-stone-500 font-light mt-1">
                {selectedGroup.assignments.length} submitted assignment
                {selectedGroup.assignments.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <StatChip label="Graded" value={gradedCount} tone="emerald" />
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
          <div className="flex items-center gap-2">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.id === "ALL"
                  ? selectedGroup.assignments.length
                  : filter.id === "GRADED"
                    ? gradedCount
                    : pendingCount;
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
          {filteredAssignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70">
              <EmptyState
                icon={ClipboardList}
                label="Nothing here"
                description="No assignments match this filter."
                compact
              />
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAssignments.map((assignment) => (
                <AssignmentHistoryRow
                  key={assignment.id}
                  assignment={assignment}
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
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700/80 mb-2">
            Submitted work
          </p>
          <h2 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Your submitted assignments
          </h2>
          <p className="text-sm text-stone-500 font-light mt-2">
            Grouped by course — open a course to review submissions, marks, and feedback.
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
              submittedCount={group.assignments.length}
              gradedCount={group.gradedCount}
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
      <AssignmentSubmissionDetailModal
        assignment={detailAssignment}
        onClose={() => setDetailAssignment(null)}
      />
    </>
  );
}
