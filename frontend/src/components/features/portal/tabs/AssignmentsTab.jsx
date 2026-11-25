"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ClipboardList, RefreshCw } from "lucide-react";
import { useStudentAssignments } from "@/hooks/student/useStudentAssignments";
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
import AssignmentDetailModal from "../course-detail/AssignmentDetailModal";

// The design's `SP.assignments`: one table of everything across every course,
// filtered by a strip of status tabs, rather than a grid of course cards to
// drill into. The Course column is what the old grouping was really for, and a
// row carries it, so nothing is lost by flattening — while "what do I owe
// right now" stops being a question you have to open four cards to answer.
//
// `?assignmentCourse=<id>` is kept and now means *filter to this course*
// instead of *open this course's screen*. Nothing in the app links with it
// (the dashboard links to the bare tab), but it survives a bookmark, and the
// course filter writes it so the view stays shareable.

// Which tab an assignment belongs in. Deliberately one function: the tab
// counts, the filtering and the row's own status label must agree, and three
// copies of these rules is how they stop agreeing.
//
// `is_locked` only hides work that has not been handed in — the backend blocks
// a *new* submission on a locked module (assignments.views.AssignmentSubmitView)
// and says nothing about one already submitted, so an assignment submitted
// before its module locked keeps its real status rather than reading "Locked".
function bucketOf(assignment) {
  const submission = assignment.submission;
  if (!submission) return assignment.is_locked ? "locked" : "todo";
  return submission.marks !== null ? "graded" : "submitted";
}

const STATUS_TONES = {
  DRAFT: "neutral",
  SUBMITTED: "blue",
  LATE: "bad",
  GRADED: "ok",
  RETURNED: "blue",
  RESUBMITTED: "blue",
};

function statusOf(assignment) {
  const submission = assignment.submission;
  if (!submission) {
    if (assignment.is_locked) return { label: "Locked", tone: "neutral" };
    return assignment.is_overdue
      ? { label: "Overdue", tone: "bad" }
      : { label: "To do", tone: "warn" };
  }
  const raw = submission.status || "SUBMITTED";
  const label = raw.charAt(0) + raw.slice(1).toLowerCase();
  return { label, tone: STATUS_TONES[raw] ?? "blue" };
}

// Ten a page, the size every other paginated table in the portal uses. The
// design's mock shows no pager because its seed data is a handful of rows; a
// real roster is hundreds, and a tab that renders all of them is a scroll
// nobody reaches the end of.
const PAGE_SIZE = 10;

const TABS = [
  { value: "todo", label: "To do" },
  { value: "submitted", label: "Submitted" },
  { value: "graded", label: "Graded" },
  { value: "locked", label: "Locked" },
];

export default function AssignmentsTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseFilter = searchParams.get("assignmentCourse") || "";
  const [tab, setTab] = useState("todo");
  const [page, setPage] = useState(1);
  const [resultsRef, changePage] = usePaginationAnchor(setPage);
  const [detailAssignment, setDetailAssignment] = useState(null);

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

  // Submitting is refused for a course whose enrolment is not ACTIVE, which is
  // the modal's business — but the answer is per course, so it is resolved here
  // where every row is, and handed down for the row the reader opened.
  const activeCourseIds = useMemo(() => {
    const ids = new Set();
    enrollments.forEach((enrollment) => {
      if (enrollment.course?.id && enrollment.status === "ACTIVE") {
        ids.add(enrollment.course.id);
      }
    });
    return ids;
  }, [enrollments]);

  // Every course that has assignments, for the filter. Built from the
  // assignments themselves rather than from enrolments, so a course cannot
  // appear in the filter and then show an empty table.
  const courses = useMemo(() => {
    const map = new Map();
    assignments.forEach((assignment) => {
      if (assignment.course?.id && !map.has(assignment.course.id)) {
        map.set(assignment.course.id, assignment.course);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.title || "").localeCompare(b.title || ""),
    );
  }, [assignments]);

  const scoped = useMemo(
    () =>
      courseFilter
        ? assignments.filter(
            (assignment) => String(assignment.course?.id) === courseFilter,
          )
        : assignments,
    [assignments, courseFilter],
  );

  const counts = useMemo(() => {
    const tally = { todo: 0, submitted: 0, graded: 0, locked: 0 };
    scoped.forEach((assignment) => {
      tally[bucketOf(assignment)] += 1;
    });
    return tally;
  }, [scoped]);

  // Soonest first, which is the order the question "what is due?" is asked in.
  // A missing due date sorts last rather than to 1970.
  const rows = useMemo(
    () =>
      scoped
        .filter((assignment) => bucketOf(assignment) === tab)
        .sort((a, b) => {
          const at = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bt = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          return at - bt;
        }),
    [scoped, tab],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Derived, never stored: a filter can shrink the list under the reader, and
  // clamping here means the table is always right on the first render rather
  // than showing an empty page and then correcting itself.
  const safePage = Math.min(page, totalPages);
  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function changeTab(value) {
    setTab(value);
    setPage(1);
  }

  function setCourseFilter(value) {
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("assignmentCourse", value);
    else params.delete("assignmentCourse");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} tone="portal" label="Loading your assignments..." />
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
          Failed to load assignments
        </h2>
        <p className="mb-6 text-sm text-cn-p-ink-2">
          {getApiErrorMessage(error, "Unable to load your assignments.")}
        </p>
        <PortalButton onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </PortalButton>
      </PortalCard>
    );
  }

  return (
    // `grid-cols-[minmax(0,1fr)]`, not a bare `grid`: a grid item defaults to
    // `min-width:auto` and so refuses to shrink below its content, and the
    // table below is wider than a phone. Left alone the column grew to the
    // table's intrinsic width and took the whole page with it — the heading
    // ran off the right edge and the screen scrolled sideways instead of the
    // table scrolling inside its own wrapper.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Assignments"
        subtitle="Everything you need to hand in, and everything you already have."
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

      {assignments.length === 0 ? (
        <PortalCard>
          <PortalEmpty
            icon={ClipboardList}
            title="No assignments yet"
            text="Once your instructors publish assignments in your enrolled courses, they will appear here."
          />
        </PortalCard>
      ) : (
        <PortalCard>
          <div ref={resultsRef} className="scroll-mt-24 px-4">
            <PortalTabs
              ariaLabel="Filter assignments by status"
              options={TABS.map((item) => ({ ...item, count: counts[item.value] }))}
              value={tab}
              onChange={changeTab}
            />
          </div>

          {rows.length === 0 ? (
            <PortalEmpty
              icon={ClipboardList}
              title="Nothing here"
              text="Assignments move between these tabs as you submit them and they get graded."
            />
          ) : (
            <PortalTable>
              <thead>
                <tr>
                  <PortalTh>Assignment</PortalTh>
                  <PortalTh>Course</PortalTh>
                  <PortalTh>Due</PortalTh>
                  <PortalTh>Status</PortalTh>
                  <PortalTh align="right">
                    {tab === "graded" ? "Grade" : "Marks"}
                  </PortalTh>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((assignment) => {
                  const status = statusOf(assignment);
                  const submission = assignment.submission;
                  const isGraded = Boolean(submission) && submission.marks !== null;
                  // A locked assignment has nothing to open: the modal's only
                  // actions are submitting and reading a grade, and it has
                  // neither. The row says why instead.
                  const isLocked = Boolean(assignment.is_locked) && !submission;
                  return (
                    <PortalTr
                      key={assignment.id}
                      disabled={isLocked}
                      title={isLocked ? assignment.lock_info?.reason : undefined}
                      onOpen={
                        isLocked ? undefined : () => setDetailAssignment(assignment)
                      }
                    >
                      <PortalTd>
                        <b className="font-semibold text-cn-p-ink">
                          {assignment.title}
                        </b>
                        {assignment.module?.title && (
                          <span className="mt-0.5 block text-[13px] text-cn-p-muted">
                            {assignment.module.title}
                          </span>
                        )}
                      </PortalTd>
                      <PortalTd className="text-sm text-cn-p-ink-2">
                        {assignment.course?.title || "—"}
                      </PortalTd>
                      <PortalTd className="text-sm text-cn-p-ink-2">
                        {/* A date, not a timestamp: the design prints "Nov 12"
                            here, and a column of "10/28/2026, 5:13 PM" is
                            unreadable at a glance. The modal keeps the time,
                            which is where it actually matters. */}
                        {formatDate(assignment.due_date)}
                      </PortalTd>
                      <PortalTd>
                        <PortalPill tone={status.tone}>{status.label}</PortalPill>
                      </PortalTd>
                      <PortalTd align="right" numeric className="text-sm">
                        {isGraded ? (
                          <>
                            <b className="font-bold text-cn-p-ink">
                              {submission.marks}
                            </b>
                            <span className="text-cn-p-ink-2">
                              {" "}
                              / {assignment.total_marks}
                            </span>
                          </>
                        ) : (
                          <span className="text-cn-p-ink-2">
                            {assignment.total_marks}
                          </span>
                        )}
                      </PortalTd>
                    </PortalTr>
                  );
                })}
              </tbody>
            </PortalTable>
          )}

          {rows.length > 0 && (
            <div className="px-5 pb-4">
              <Pagination
                size="lg"
                tone="cobalt"
                page={safePage}
                totalPages={totalPages}
                onPageChange={changePage}
                totalLabel={`${rows.length} assignment${rows.length === 1 ? "" : "s"}`}
              />
            </div>
          )}
        </PortalCard>
      )}

      <AssignmentDetailModal
        assignment={detailAssignment}
        canInteract={
          Boolean(detailAssignment) &&
          activeCourseIds.has(detailAssignment.course?.id)
        }
        onClose={() => setDetailAssignment(null)}
      />
    </div>
  );
}
