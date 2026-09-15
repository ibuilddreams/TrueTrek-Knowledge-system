"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Filter, Eye, ShieldAlert, AlertCircle, RefreshCw, BookOpen, Users,
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
import { ROUTES } from "@/constants/routes";
import CloseButton from "@/components/ui/CloseButton";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import FlagConcernModal from "@/components/features/teachers/FlagConcernModal";

const RISK_FILTERS = [
  { id: "struggling", label: "Struggling", field: "is_struggling" },
  { id: "disengaged", label: "Disengaged", field: "is_disengaged" },
  { id: "needs_attention", label: "Needs Attention", field: "needs_attention" },
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

      router.push(`${ROUTES.MESSAGES}?conversation=${conversationId}`);
    } catch (error) {
      toastError(getApiErrorMessage(error, "Unable to start a conversation with this student."));
      setIsMessagingStudentId(null);
    }
  };

  if (status === "loading" || status === "idle") {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading enrolled students">
        <div className="h-16 rounded-2xl bg-porcelain animate-pulse" />
        <div className="h-80 rounded-2xl bg-porcelain animate-pulse" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="bg-paper border border-line rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-ink mb-2">
          Failed to Load Students
        </h2>
        <p className="text-sm text-muted font-light mb-6">{error}</p>
        <button
          type="button"
          onClick={() => loadEnrolledStudents({ force: true })}
          className="inline-flex items-center gap-2 px-5 py-3 bg-pine hover:bg-moss text-paper font-bold font-mono text-sm uppercase tracking-wider rounded-xl shadow-md transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-paper border border-line rounded-card shadow-soft">
        <EmptyState
          icon={Users}
          label="No enrolled students yet"
          description="Students enrolled in your assigned courses will appear here with live progress and quiz scores."
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {RISK_FILTERS.map((filter) => {
          const isActive = riskFilter === filter.id;
          const count = summary?.[`${filter.id}_count`] ?? 0;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setRiskFilter(isActive ? "all" : filter.id)}
              className={`text-left p-4 rounded-2xl border shadow-sm transition ${
                isActive
                  ? "bg-pine/10 border-pine/30 ring-1 ring-pine/20"
                  : "bg-paper border-line hover:border-pine/25"
              }`}
            >
              <span className="block text-2xl font-serif font-black text-ink">{count}</span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                {filter.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-paper border border-line p-5 rounded-card shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-porcelain border border-line/90 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-pine transition"
            placeholder="Search by name, email, or course..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-porcelain border border-line/90 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-mono text-ink border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <span className="text-[11px] font-mono uppercase px-2.5 py-1 bg-porcelain border border-line text-muted rounded-lg">
            {filteredStudents.length} / {total} Students
          </span>
        </div>
      </div>

      <div className="bg-paper border border-line rounded-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-porcelain text-muted font-mono text-[11px] uppercase tracking-wider border-b border-line/80">
                <th className="py-4 px-6 font-semibold">Student Name / Email</th>
                <th className="py-4 px-6 font-semibold">Courses</th>
                <th className="py-4 px-6 font-semibold text-center">Avg Score</th>
                <th className="py-4 px-6 font-semibold">Progress</th>
                <th className="py-4 px-6 font-semibold">Last Active</th>
                <th className="py-4 px-6 font-semibold text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line text-muted text-sm">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const riskReasons = (student.risk_reasons || []).join(", ");
                  const progress = Math.round(student.average_progress || 0);
                  const score = Math.round(student.average_score || 0);
                  const courseLabel =
                    student.courses_count === 1
                      ? student.courses?.[0]?.title || "1 course"
                      : `${student.courses_count} courses`;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-porcelain/60 transition-colors ${
                        selectedStudentId === student.id ? "bg-porcelain" : ""
                      }`}
                    >
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-porcelain border border-line flex items-center justify-center font-bold text-muted text-sm shadow-inner shrink-0">
                            {initialsFor(student.name)}
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setQuickViewStudent(student)}
                                className="font-serif font-black text-ink hover:text-pine transition-colors cursor-pointer hover:underline text-left block"
                              >
                                {student.name}
                              </button>
                              {student.is_struggling && (
                                <span
                                  title={riskReasons}
                                  className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-md px-1.5 py-0.5 text-[8.5px] font-mono font-bold"
                                >
                                  <TrendingDown className="w-3 h-3 text-rose-500 shrink-0" />
                                  STRUGGLING
                                </span>
                              )}
                              {student.is_disengaged && (
                                <span
                                  title={riskReasons}
                                  className="inline-flex items-center gap-1 bg-gold/12 text-gold border border-gold/25 rounded-md px-1.5 py-0.5 text-[8.5px] font-mono font-bold"
                                >
                                  <Clock className="w-3 h-3 text-gold shrink-0" />
                                  DISENGAGED
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-muted mt-0.5">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-1.5 text-muted">
                          <BookOpen className="w-3.5 h-3.5 text-muted shrink-0" />
                          <span className="truncate max-w-[180px]" title={courseLabel}>
                            {courseLabel}
                          </span>
                        </div>
                      </td>

                      <td className="py-4.5 px-6 text-center font-mono font-bold text-ink">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md ${
                            score >= 90
                              ? "text-emerald-700 bg-emerald-50"
                              : score >= 70
                                ? "text-gold bg-gold/12"
                                : "text-rose-700 bg-rose-50"
                          }`}
                        >
                          {score}%
                        </span>
                      </td>

                      <td className="py-4.5 px-6">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-porcelain h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progress >= 80 ? "bg-emerald-500" : "bg-pine"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-6 font-mono text-xs text-muted">
                        {student.last_activity_at
                          ? formatDate(student.last_activity_at)
                          : "No activity"}
                      </td>

                      <td className="py-4.5 px-6 text-center">
                        <StatusBadge status={student.status} size="lg" />
                      </td>

                      <td className="py-4.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => openStudentDrawer(student.id)}
                          title="View student details"
                          aria-label={`View details for ${student.name}`}
                          className="p-1.5 text-muted hover:text-ink hover:bg-porcelain rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted font-light">
                    <span className="block font-mono text-sm uppercase text-muted mb-1">
                      NO RECORDS FOUND
                    </span>
                    No students match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-lg bg-paper h-screen shadow-2xl p-6 sm:p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
                <h3 className="font-serif font-black text-xl text-ink">Student Dossier</h3>
                <CloseButton
                  onClick={closeStudentDrawer}
                  className="p-1.5 border border-line rounded-full text-muted hover:text-ink hover:bg-porcelain transition"
                  iconClassName="w-4.5 h-4.5"
                />
              </div>

              <div className="flex items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => handleMessageStudent(selectedStudentId)}
                  disabled={isMessagingStudentId === selectedStudentId}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-pine hover:bg-moss disabled:opacity-60 text-paper text-xs font-semibold font-mono uppercase tracking-wider rounded-xl transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {isMessagingStudentId === selectedStudentId ? "Opening..." : "Message Student"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsFlagConcernModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold font-mono uppercase tracking-wider rounded-xl transition"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Flag Concern
                </button>
              </div>

              {selectedStudent?.risk_reasons?.length > 0 && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 mb-6 space-y-2">
                  <h4 className="text-[11px] font-mono uppercase tracking-widest text-rose-700 font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Flags
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedStudent.risk_reasons.map((reason, index) => (
                      <li key={index} className="text-sm text-rose-800 flex items-start gap-2">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(detailStatus === "loading" || detailStatus === "idle") && (
                <div className="space-y-4" aria-busy="true">
                  <div className="h-16 rounded-xl bg-porcelain animate-pulse" />
                  <div className="h-24 rounded-xl bg-porcelain animate-pulse" />
                  <div className="h-40 rounded-xl bg-porcelain animate-pulse" />
                </div>
              )}

              {detailStatus === "failed" && (
                <div className="text-center py-10">
                  <p className="text-sm text-rose-600 mb-4">{detailError}</p>
                  <button
                    type="button"
                    onClick={() => loadStudentDetail(selectedStudentId)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-pine text-paper text-sm font-mono uppercase rounded-lg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {detailStatus === "succeeded" && studentDetail && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pine/10 border border-pine/30 rounded-2xl flex items-center justify-center font-bold text-pine text-base">
                      {initialsFor(studentDetail.student?.full_name || studentDetail.student?.email)}
                    </div>
                    <div>
                      <h4 className="font-serif font-black text-lg text-ink">
                        {studentDetail.student?.full_name}
                      </h4>
                      <p className="text-sm font-mono text-muted mt-0.5">
                        {studentDetail.student?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-porcelain p-3 rounded-xl border border-line/60">
                      <p className="text-[11px] font-mono text-muted uppercase tracking-widest">
                        Courses
                      </p>
                      <p className="text-sm font-bold text-ink mt-1">
                        {studentDetail.total_courses}
                      </p>
                    </div>
                    <div className="bg-porcelain p-3 rounded-xl border border-line/60">
                      <p className="text-[11px] font-mono text-muted uppercase tracking-widest">
                        Account
                      </p>
                      <p className="text-sm font-bold text-ink mt-1">
                        {studentDetail.student?.account_status || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-mono uppercase tracking-wider text-muted font-bold">
                      Enrolled Courses
                    </h4>
                    {(studentDetail.courses || []).map((entry) => (
                      <div
                        key={`${entry.course?.id}-${entry.enrolled_at}`}
                        className="p-4 rounded-xl border border-line bg-porcelain/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-serif font-bold text-ink truncate">
                              {entry.course?.title}
                            </p>
                            <p className="text-[11px] font-mono text-muted mt-0.5">
                              Enrolled {formatDate(entry.enrolled_at)}
                            </p>
                          </div>
                          <StatusBadge status={entry.status} size="lg" />
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-[11px] font-mono text-muted mb-1">
                            <span>Progress</span>
                            <span>{Math.round(entry.completion_percentage || 0)}%</span>
                          </div>
                          <div className="w-full bg-porcelain/70 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-pine h-full"
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
            className="fixed inset-0 bg-ink/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setQuickViewStudent(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-paper border border-line w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3.5 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-pine/10 border border-pine/20 rounded-xl flex items-center justify-center font-bold text-pine text-sm shrink-0">
                    {initialsFor(quickViewStudent.name)}
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-base text-ink">
                      {quickViewStudent.name}
                    </h3>
                    <p className="text-[11px] font-mono text-muted mt-0.5">
                      {quickViewStudent.email}
                    </p>
                  </div>
                </div>
                <CloseButton
                  onClick={() => setQuickViewStudent(null)}
                  className="p-1 border border-line rounded-full text-muted hover:text-ink hover:bg-porcelain transition shrink-0"
                  iconClassName="w-4 h-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-porcelain p-3 rounded-xl border border-line font-mono text-[11px]">
                <div>
                  <span className="text-muted uppercase block">Courses</span>
                  <span className="text-ink font-bold font-sans block mt-0.5">
                    {quickViewStudent.courses_count}
                  </span>
                </div>
                <div>
                  <span className="text-muted uppercase block">Status</span>
                  <span className="text-ink font-bold block mt-0.5">
                    {quickViewStudent.status}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-line/50">
                  <span className="text-muted uppercase block">Last Active</span>
                  <span className="font-bold block mt-0.5 text-ink">
                    {quickViewStudent.last_activity_at
                      ? formatDate(quickViewStudent.last_activity_at)
                      : "No recorded activity"}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
                    <span className="text-muted uppercase font-semibold">Progress</span>
                    <span className="text-pine font-bold">
                      {Math.round(quickViewStudent.average_progress || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-porcelain rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-pine h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(quickViewStudent.average_progress || 0)}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[11px] font-mono mb-1.5">
                    <span className="text-muted uppercase font-semibold">Quiz Average</span>
                    <span className="text-emerald-700 font-bold">
                      {Math.round(quickViewStudent.average_score || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-porcelain rounded-full h-2.5 overflow-hidden">
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

              <div className="pt-3 border-t border-line flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openStudentDrawer(quickViewStudent.id);
                    setQuickViewStudent(null);
                  }}
                  className="flex-1 py-2 bg-pine hover:bg-moss text-paper font-mono text-[11px] uppercase font-bold rounded-lg transition text-center"
                >
                  Open Full Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setQuickViewStudent(null)}
                  className="px-4 py-2 bg-transparent border border-line hover:bg-porcelain text-ink font-mono text-[11px] uppercase font-semibold rounded-lg transition"
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
