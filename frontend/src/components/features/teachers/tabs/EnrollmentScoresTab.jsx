"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye, ShieldAlert, AlertCircle, RefreshCw, BookOpen, Users,
  TrendingDown, Clock, MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTeacherEnrolledStudents } from "@/hooks/useTeacherEnrolledStudents";
import { useTeacherStudentDetail } from "@/hooks/useTeacherStudentDetail";
import { formatDate } from "@/lib/adminFormatters";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import { sendMessage, startConversation } from "@/services/messagingService";
import { getTeacherEnrolledStudentDetail } from "@/services/teacherCoursesService";
import { AUTH_ROLES } from "@/constants/auth";
import { portalHref } from "@/components/features/portal/shell/portalNav";
import CloseButton from "@/components/ui/CloseButton";
import StatusBadge from "@/components/ui/StatusBadge";
import SearchBar from "@/components/ui/SearchBar";
import PortalCard, {
  PortalBar,
} from "@/components/features/portal/shell/PortalCard";
import {
  PortalButton,
  PortalEmpty,
  PortalPageHead,
  PortalPill,
  PortalTable,
  PortalTd,
  PortalTh,
  PortalToolbar,
  PortalToolbarCount,
  PortalTr,
} from "@/components/features/portal/shell/PortalUI";
import FlagConcernModal from "@/components/features/teachers/FlagConcernModal";

const RISK_FILTERS = [
  {
    id: "struggling",
    label: "Struggling",
    field: "is_struggling",
    hint: "Low progress or low scores",
  },
  {
    id: "disengaged",
    label: "Disengaged",
    field: "is_disengaged",
    hint: "No recent activity",
  },
  {
    id: "needs_attention",
    label: "Needs attention",
    field: "needs_attention",
    hint: "Flagged by progress or overdue work",
  },
];

function initialsFor(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function EnrollmentScoresTab() {
  const router = useRouter();
  const {
    items: students,
    total,
    summary,
    status,
    error,
    loadEnrolledStudents,
  } = useTeacherEnrolledStudents();

  const {
    data: studentDetail,
    status: detailStatus,
    error: detailError,
    loadStudentDetail,
    clearStudentDetail,
  } = useTeacherStudentDetail();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [quickViewStudent, setQuickViewStudent] = useState(null);
  const [isFlagConcernModalOpen, setIsFlagConcernModalOpen] = useState(false);
  const [isMessagingStudentId, setIsMessagingStudentId] = useState(null);

  useEffect(() => {
    loadEnrolledStudents();
  }, [loadEnrolledStudents]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const activeRiskFilter = RISK_FILTERS.find((filter) => filter.id === riskFilter);
    return students.filter((student) => {
      const courseTitles = (student.courses || []).map((course) => course.title).join(" ");
      const haystack = `${student.name || ""} ${student.email || ""} ${courseTitles}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus =
        selectedStatusFilter === "all" || student.status === selectedStatusFilter;
      const matchesRisk = !activeRiskFilter || student[activeRiskFilter.field];
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [students, searchQuery, selectedStatusFilter, riskFilter]);

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const openStudentDrawer = (studentId) => {
    setSelectedStudentId(studentId);
    loadStudentDetail(studentId);
  };

  const closeStudentDrawer = () => {
    setSelectedStudentId(null);
    clearStudentDetail();
  };

  // Picks which enrolled course the opening message should be about — the
  // ACTIVE course the student has made the least progress in, since that's
  // the one most likely to be the reason the teacher is reaching out.
  const pickCourseForGreeting = (detail) => {
    const courses = detail?.courses || [];
    if (courses.length === 0) return null;
    const active = courses.filter((entry) => entry.status === "ACTIVE");
    const pool = active.length > 0 ? active : courses;
    return pool.reduce((lowest, entry) =>
      (entry.completion_percentage ?? 0) < (lowest.completion_percentage ?? 0) ? entry : lowest
    ).course;
  };

  const buildGreeting = (student, courseTitle) => {
    const firstName = (student?.name || "").split(" ")[0] || "there";
    if (student?.is_struggling || student?.is_disengaged) {
      return `Hi ${firstName}, I noticed you might be struggling in ${courseTitle} — how can I help you get back on track?`;
    }
    return `Hi ${firstName}, just checking in on your progress in ${courseTitle}. Let me know if you have any questions!`;
  };

  const handleMessageStudent = async (studentId) => {
    setIsMessagingStudentId(studentId);
    try {
      const response = await startConversation(studentId);
      const conversationId = response?.data?.id;
      if (!conversationId) {
        throw new Error("Conversation could not be started.");
      }

      const isNewConversation = !response?.data?.last_message;
      if (isNewConversation) {
        try {
          // Fetched fresh rather than read from the (possibly still-loading,
          // or previous-student) drawer state — this button sits above the
          // drawer's own loading skeleton, so it's clickable before that
          // data has necessarily arrived.
          const detailResponse = await getTeacherEnrolledStudentDetail(studentId);
          const course = pickCourseForGreeting(detailResponse?.data);
          if (course) {
            const student = students.find((entry) => entry.id === studentId) || selectedStudent;
            await sendMessage(conversationId, {
              body: buildGreeting(student, course.title),
              courseId: course.id,
            });
          }
        } catch {
          // The course-card opener is a nice-to-have — don't block the
          // teacher from reaching the conversation if it fails to send.
        }
      }

      router.push(
        `${portalHref(AUTH_ROLES.FACULTY, "messages")}?conversation=${conversationId}`,
      );
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to start a conversation with this student."));
      setIsMessagingStudentId(null);
    }
  };

  if (status === "loading" || status === "idle") {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading enrolled students">
        <div className="h-16 rounded-2xl bg-cn-p-page animate-pulse" />
        <div className="h-80 rounded-2xl bg-cn-p-page animate-pulse" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <PortalCard className="mx-auto flex max-w-lg flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-bold text-cn-p-ink">
          We couldn&apos;t load your students
        </h2>
        <p className="text-sm text-cn-p-ink-2">{error}</p>
        <PortalButton size="sm" onClick={() => loadEnrolledStudents({ force: true })}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </PortalButton>
      </PortalCard>
    );
  }

  if (students.length === 0) {
    return (
      <PortalCard>
        <PortalEmpty
          icon={Users}
          title="No enrolled students yet"
          text="Students enrolled in your assigned courses appear here with live progress and quiz scores."
        />
      </PortalCard>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Students & scores"
        subtitle="Everyone enrolled in your courses. Flags are calculated from activity, progress and overdue work."
      />

      {/* The design's three risk tiles double as the filter: pressing one
          narrows the table below, pressing it again clears it. */}
      <div className="grid gap-3 sm:grid-cols-3">
        {RISK_FILTERS.map((filter) => {
          const isActive = riskFilter === filter.id;
          const count = summary?.[`${filter.id}_count`] ?? 0;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setRiskFilter(isActive ? "all" : filter.id)}
              className={`rounded-cn-p border bg-cn-p-card p-5 text-left transition ${ isActive ? "border-cn-p-accent" : "border-cn-p-line hover:border-cn-p-line-2" }`}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="text-sm text-cn-p-ink-2">{filter.label}</span>
                <span
                  className={`grid h-9 w-9 flex-none place-items-center rounded-cn-p-sm ${ filter.id === "struggling" ? "bg-cn-p-bad-bg text-cn-p-bad" : "bg-cn-p-warn-bg text-cn-p-warn" }`}
                >
                  <AlertCircle className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
              </span>
              <span className="mt-3 block text-[32px] leading-none font-extrabold tracking-[-0.02em] tabular-nums text-cn-p-ink">
                {count}
              </span>
              <span className="mt-2 block text-[13px] text-cn-p-muted">{filter.hint}</span>
            </button>
          );
        })}
      </div>

      <PortalCard className="overflow-hidden">
        <PortalToolbar>
          <SearchBar
            tone="cobalt"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search students"
            className="w-full sm:w-[280px]"
            size="lg"
          />
          {/* The design's `.sel` — one control, its own chevron. */}
          <select
            aria-label="Enrolment status"
            value={selectedStatusFilter}
            onChange={(event) => setSelectedStatusFilter(event.target.value)}
            className="cn-p-select h-10 rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3 text-sm text-cn-p-ink outline-none focus:border-cn-p-accent"
          >
            <option value="all">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          {riskFilter !== "all" && (
            <button
              type="button"
              onClick={() => setRiskFilter("all")}
              className="text-sm font-semibold text-cn-p-accent hover:underline"
            >
              Clear flag filter
            </button>
          )}
          <PortalToolbarCount>
            {filteredStudents.length} / {total} students
          </PortalToolbarCount>
        </PortalToolbar>

        {filteredStudents.length === 0 ? (
          <PortalEmpty
            icon={Users}
            title="No students match these filters"
            text="Clear the search or the flag filter to see everyone again."
          />
        ) : (
          <PortalTable>
            <thead>
              <tr>
                <PortalTh>Student</PortalTh>
                <PortalTh>Courses</PortalTh>
                <PortalTh align="right">Avg score</PortalTh>
                <PortalTh>Progress</PortalTh>
                <PortalTh>Last active</PortalTh>
                <PortalTh>Status</PortalTh>
                <PortalTh align="right">
                  <span className="sr-only">Actions</span>
                </PortalTh>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => {
                const riskReasons = (student.risk_reasons || []).join(", ");
                const progress = Math.round(student.average_progress || 0);
                const score = Math.round(student.average_score || 0);
                const courseLabel =
                  student.courses_count === 1
                    ? student.courses?.[0]?.title || "1 course"
                    : `${student.courses_count} courses`;

                return (
                  <PortalTr
                    key={student.id}
                    className={selectedStudentId === student.id ? "bg-cn-p-page" : ""}
                  >
                    <PortalTd>
                      <span className="flex items-center gap-3">
                        <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-cn-p-soft text-sm font-bold text-cn-p-soft-ink">
                          {initialsFor(student.name)}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuickViewStudent(student)}
                              className="cursor-pointer text-left font-semibold text-cn-p-ink hover:text-cn-p-accent hover:underline"
                            >
                              {student.name}
                            </button>
                            {student.is_struggling && (
                              <PortalPill tone="bad" title={riskReasons}>
                                <TrendingDown className="h-3 w-3" />
                                Struggling
                              </PortalPill>
                            )}
                            {student.is_disengaged && (
                              <PortalPill tone="warn" title={riskReasons}>
                                <Clock className="h-3 w-3" />
                                Disengaged
                              </PortalPill>
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-cn-p-muted">
                            {student.email}
                          </span>
                        </span>
                      </span>
                    </PortalTd>

                    <PortalTd className="text-sm text-cn-p-ink-2">
                      <span className="flex items-center gap-1.5">
                        <BookOpen aria-hidden="true" className="h-3.5 w-3.5 flex-none" />
                        <span className="max-w-[180px] truncate" title={courseLabel}>
                          {courseLabel}
                        </span>
                      </span>
                    </PortalTd>

                    <PortalTd align="right" numeric>
                      <b className="font-bold text-cn-p-ink">{score}%</b>
                    </PortalTd>

                    <PortalTd>
                      <span className="flex w-[140px] items-center gap-2 text-sm">
                        <PortalBar value={progress} className="flex-1" />
                        <b className="tabular-nums text-cn-p-ink">{progress}%</b>
                      </span>
                    </PortalTd>

                    <PortalTd className="text-sm whitespace-nowrap text-cn-p-ink-2">
                      {student.last_activity_at
                        ? formatDate(student.last_activity_at)
                        : "No activity"}
                    </PortalTd>

                    <PortalTd>
                      <StatusBadge tone="cobalt" status={student.status} size="lg" />
                    </PortalTd>

                    <PortalTd align="right">
                      <button
                        type="button"
                        onClick={() => openStudentDrawer(student.id)}
                        title="View student details"
                        aria-label={`View details for ${student.name}`}
                        className="grid h-9 w-9 place-items-center rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card text-cn-p-ink-2 transition hover:border-cn-p-ink hover:text-cn-p-ink"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </PortalTd>
                  </PortalTr>
                );
              })}
            </tbody>
          </PortalTable>
        )}
      </PortalCard>

      <AnimatePresence>
        {selectedStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-cn-p-ink/40 backdrop-blur-sm z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-lg bg-cn-p-card h-screen shadow-2xl p-6 sm:p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-cn-p-line mb-6">
                <h3 className="font-black text-xl text-cn-p-ink">Student Dossier</h3>
                <CloseButton
                  onClick={closeStudentDrawer}
                  className="p-1.5 border border-cn-p-line rounded-full text-cn-p-ink-2 hover:text-cn-p-ink hover:bg-cn-p-page transition"
                  iconClassName="w-4.5 h-4.5"
                />
              </div>

              <div className="flex items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => handleMessageStudent(selectedStudentId)}
                  disabled={isMessagingStudentId === selectedStudentId}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cn-p-accent hover:bg-cn-p-accent-hover disabled:opacity-60 text-white text-xs font-semibold rounded-cn-p-sm transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isMessagingStudentId === selectedStudentId ? "Opening..." : "Message Student"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFlagConcernModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-cn-p-bad-bg hover:bg-cn-p-bad-bg text-cn-p-bad text-xs font-semibold rounded-xl transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Flag concern
                </button>
              </div>

              {selectedStudent?.risk_reasons?.length > 0 && (
                <div className="rounded-xl border border-cn-p-bad-bg bg-cn-p-bad-bg p-4 mb-6 space-y-2">
                  <h4 className="text-[11px] text-cn-p-bad font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Flags
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedStudent.risk_reasons.map((reason, index) => (
                      <li key={index} className="text-sm text-cn-p-bad flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-cn-p-bad shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(detailStatus === "loading" || detailStatus === "idle") && (
                <div className="space-y-4" aria-busy="true">
                  <div className="h-16 rounded-xl bg-cn-p-page animate-pulse" />
                  <div className="h-24 rounded-xl bg-cn-p-page animate-pulse" />
                  <div className="h-40 rounded-xl bg-cn-p-page animate-pulse" />
                </div>
              )}

              {detailStatus === "failed" && (
                <div className="text-center py-10">
                  <p className="text-sm text-cn-p-bad mb-4">{detailError}</p>
                  <button
                    type="button"
                    onClick={() => loadStudentDetail(selectedStudentId)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cn-p-accent text-white text-sm rounded-cn-p-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {detailStatus === "succeeded" && studentDetail && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-cn-p-soft border border-cn-p-accent-soft rounded-2xl flex items-center justify-center font-bold text-cn-p-accent text-base">
                      {initialsFor(studentDetail.student?.full_name || studentDetail.student?.email)}
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-cn-p-ink">
                        {studentDetail.student?.full_name}
                      </h4>
                      <p className="text-sm text-cn-p-ink-2 mt-0.5">
                        {studentDetail.student?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-cn-p-page p-3 rounded-xl border border-cn-p-line">
                      <p className="text-[11px] text-cn-p-ink-2">
                        Courses
                      </p>
                      <p className="text-sm font-bold text-cn-p-ink mt-1">
                        {studentDetail.total_courses}
                      </p>
                    </div>
                    <div className="bg-cn-p-page p-3 rounded-xl border border-cn-p-line">
                      <p className="text-[11px] text-cn-p-ink-2">
                        Account
                      </p>
                      <p className="text-sm font-bold text-cn-p-ink mt-1">
                        {studentDetail.student?.account_status || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm text-cn-p-ink-2 font-bold">
                      Enrolled courses
                    </h4>
                    {(studentDetail.courses || []).map((entry) => (
                      <div
                        key={`${entry.course?.id}-${entry.enrolled_at}`}
                        className="p-4 rounded-xl border border-cn-p-line bg-cn-p-page"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-cn-p-ink truncate">
                              {entry.course?.title}
                            </p>
                            <p className="text-[11px] text-cn-p-ink-2 mt-0.5">
                              Enrolled {formatDate(entry.enrolled_at)}
                            </p>
                          </div>
                          <StatusBadge tone="cobalt" status={entry.status} size="lg" />
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-[11px] text-cn-p-ink-2 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(entry.completion_percentage || 0)}%</span>
                          </div>
                          <div className="w-full bg-cn-p-page h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-cn-p-accent h-full"
                              style={{
                                width: `${Math.round(entry.completion_percentage || 0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickViewStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-cn-p-ink/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setQuickViewStudent(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-cn-p-card border border-cn-p-line w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3.5 border-b border-cn-p-line">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-cn-p-soft border border-cn-p-accent-soft rounded-xl flex items-center justify-center font-bold text-cn-p-accent text-sm shrink-0">
                    {initialsFor(quickViewStudent.name)}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-cn-p-ink">
                      {quickViewStudent.name}
                    </h3>
                    <p className="text-[11px] text-cn-p-ink-2 mt-0.5">
                      {quickViewStudent.email}
                    </p>
                  </div>
                </div>
                <CloseButton
                  onClick={() => setQuickViewStudent(null)}
                  className="p-1 border border-cn-p-line rounded-full text-cn-p-ink-2 hover:text-cn-p-ink hover:bg-cn-p-page transition shrink-0"
                  iconClassName="w-4 h-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-cn-p-page p-3 rounded-xl border border-cn-p-line text-[11px]">
                <div>
                  <span className="text-cn-p-ink-2 block">Courses</span>
                  <span className="text-cn-p-ink font-bold font-sans block mt-0.5">
                    {quickViewStudent.courses_count}
                  </span>
                </div>
                <div>
                  <span className="text-cn-p-ink-2 block">Status</span>
                  <span className="text-cn-p-ink font-bold block mt-0.5">
                    {quickViewStudent.status}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-cn-p-line">
                  <span className="text-cn-p-ink-2 block">Last Active</span>
                  <span className="font-bold block mt-0.5 text-cn-p-ink">
                    {quickViewStudent.last_activity_at
                      ? formatDate(quickViewStudent.last_activity_at)
                      : "No recorded activity"}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1.5">
                    <span className="text-cn-p-ink-2 font-semibold">Progress</span>
                    <span className="text-cn-p-accent font-bold">
                      {Math.round(quickViewStudent.average_progress || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-cn-p-page rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-cn-p-accent h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(quickViewStudent.average_progress || 0)}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1.5">
                    <span className="text-cn-p-ink-2 font-semibold">Quiz Average</span>
                    <span className="text-emerald-700 font-bold">
                      {Math.round(quickViewStudent.average_score || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-cn-p-page rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-emerald-600 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(quickViewStudent.average_score || 0)}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-cn-p-line flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openStudentDrawer(quickViewStudent.id);
                    setQuickViewStudent(null);
                  }}
                  className="flex-1 py-2 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-[11px] font-bold rounded-lg transition text-center"
                >
                  Open full dossier
                </button>
                <button
                  type="button"
                  onClick={() => setQuickViewStudent(null)}
                  className="px-4 py-2 bg-transparent border border-cn-p-line hover:bg-cn-p-page text-cn-p-ink text-[11px] font-semibold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FlagConcernModal
        isOpen={isFlagConcernModalOpen}
        onClose={() => setIsFlagConcernModalOpen(false)}
        studentId={selectedStudent?.id}
        studentName={selectedStudent?.name}
      />
    </div>
  );
}
