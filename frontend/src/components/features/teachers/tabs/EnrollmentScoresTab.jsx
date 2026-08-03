"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Filter, Eye, ShieldAlert, AlertCircle, RefreshCw, BookOpen, Users,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTeacherEnrolledStudents } from "@/hooks/useTeacherEnrolledStudents";
import { useTeacherStudentDetail } from "@/hooks/useTeacherStudentDetail";
import { getDaysSinceLastDrill } from "@/lib/dates";
import { formatDate } from "@/lib/adminFormatters";
import CloseButton from "@/components/ui/CloseButton";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";

function initialsFor(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function activityDate(value) {
  if (!value) return null;
  return String(value).slice(0, 10);
}

function daysSinceActivity(value) {
  return getDaysSinceLastDrill(activityDate(value));
}

export default function EnrollmentScoresTab() {
  const {
    items: students,
    total,
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
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [quickViewStudent, setQuickViewStudent] = useState(null);

  useEffect(() => {
    loadEnrolledStudents();
  }, [loadEnrolledStudents]);

  const filteredStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      const courseTitles = (student.courses || []).map((course) => course.title).join(" ");
      const haystack = `${student.name || ""} ${student.email || ""} ${courseTitles}`.toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus =
        selectedStatusFilter === "all" || student.status === selectedStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, selectedStatusFilter]);

  const openStudentDrawer = (studentId) => {
    setSelectedStudentId(studentId);
    loadStudentDetail(studentId);
  };

  const closeStudentDrawer = () => {
    setSelectedStudentId(null);
    clearStudentDetail();
  };

  if (status === "loading" || status === "idle") {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading enrolled students">
        <div className="h-16 rounded-2xl bg-stone-100 animate-pulse" />
        <div className="h-80 rounded-2xl bg-stone-100 animate-pulse" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
          Failed to Load Students
        </h2>
        <p className="text-xs text-stone-500 font-light mb-6">{error}</p>
        <button
          type="button"
          onClick={() => loadEnrolledStudents({ force: true })}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
        <EmptyState
          icon={Users}
          label="No enrolled students yet"
          description="Students enrolled in your assigned courses will appear here with live progress and quiz scores."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-450">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200/90 rounded-xl pl-10 pr-4 py-2.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-600 transition"
            placeholder="Search by name, email, or course..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200/90 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-mono text-stone-605 border-none focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <span className="text-[10px] font-mono uppercase px-2.5 py-1 bg-stone-50 border border-stone-200 text-stone-500 rounded-lg">
            {filteredStudents.length} / {total} Students
          </span>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-stone-450 font-mono text-[10px] uppercase tracking-wider border-b border-stone-200/80">
                <th className="py-4 px-6 font-semibold">Student Name / Email</th>
                <th className="py-4 px-6 font-semibold">Courses</th>
                <th className="py-4 px-6 font-semibold text-center">Avg Score</th>
                <th className="py-4 px-6 font-semibold">Progress</th>
                <th className="py-4 px-6 font-semibold">Last Active</th>
                <th className="py-4 px-6 font-semibold text-center">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 text-stone-702 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const daysSinceLast = daysSinceActivity(student.last_activity_at);
                  const isAtRisk = daysSinceLast > 3;
                  const progress = Math.round(student.average_progress || 0);
                  const score = Math.round(student.average_score || 0);
                  const courseLabel =
                    student.courses_count === 1
                      ? student.courses?.[0]?.title || "1 course"
                      : `${student.courses_count} courses`;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-amber-50/10 transition-colors ${
                        selectedStudentId === student.id ? "bg-amber-50/20" : ""
                      }`}
                    >
                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-xs shadow-inner shrink-0">
                            {initialsFor(student.name)}
                          </div>
                          <div>
                            <div className="flex items-center flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setQuickViewStudent(student)}
                                className="font-serif font-black text-stone-900 hover:text-amber-800 transition-colors cursor-pointer hover:underline text-left block"
                              >
                                {student.name}
                              </button>
                              {isAtRisk && (
                                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 rounded-md px-1.5 py-0.5 text-[8.5px] font-mono font-bold">
                                  <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                                  RISK: {daysSinceLast === 999 ? ">7" : daysSinceLast}D
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-6">
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[180px]" title={courseLabel}>
                            {courseLabel}
                          </span>
                        </div>
                      </td>

                      <td className="py-4.5 px-6 text-center font-mono font-bold text-stone-900">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md ${
                            score >= 90
                              ? "text-emerald-700 bg-emerald-50"
                              : score >= 70
                                ? "text-amber-700 bg-amber-50"
                                : "text-rose-700 bg-rose-50"
                          }`}
                        >
                          {score}%
                        </span>
                      </td>

                      <td className="py-4.5 px-6">
                        <div className="space-y-1 max-w-[120px]">
                          <div className="flex items-center justify-between text-[10px] font-mono text-stone-500">
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${progress >= 80 ? "bg-emerald-500" : "bg-amber-600"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4.5 px-6 font-mono text-[11px] text-stone-500">
                        {student.last_activity_at
                          ? formatDate(student.last_activity_at)
                          : "No activity"}
                      </td>

                      <td className="py-4.5 px-6 text-center">
                        <StatusBadge status={student.status} />
                      </td>

                      <td className="py-4.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => openStudentDrawer(student.id)}
                          title="View student details"
                          aria-label={`View details for ${student.name}`}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400 font-light">
                    <span className="block font-mono text-xs uppercase text-amber-700 mb-1">
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
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-lg bg-white h-screen shadow-2xl p-6 sm:p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
                <h3 className="font-serif font-black text-xl text-stone-900">Student Dossier</h3>
                <CloseButton
                  onClick={closeStudentDrawer}
                  className="p-1.5 border border-stone-200 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition"
                  iconClassName="w-4.5 h-4.5"
                />
              </div>

              {(detailStatus === "loading" || detailStatus === "idle") && (
                <div className="space-y-4" aria-busy="true">
                  <div className="h-16 rounded-xl bg-stone-100 animate-pulse" />
                  <div className="h-24 rounded-xl bg-stone-100 animate-pulse" />
                  <div className="h-40 rounded-xl bg-stone-100 animate-pulse" />
                </div>
              )}

              {detailStatus === "failed" && (
                <div className="text-center py-10">
                  <p className="text-xs text-rose-600 mb-4">{detailError}</p>
                  <button
                    type="button"
                    onClick={() => loadStudentDetail(selectedStudentId)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-xs font-mono uppercase rounded-lg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {detailStatus === "succeeded" && studentDetail && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-600/10 border border-amber-600/30 rounded-2xl flex items-center justify-center font-bold text-amber-750 text-base">
                      {initialsFor(studentDetail.student?.full_name || studentDetail.student?.email)}
                    </div>
                    <div>
                      <h4 className="font-serif font-black text-lg text-stone-900">
                        {studentDetail.student?.full_name}
                      </h4>
                      <p className="text-xs font-mono text-stone-400 mt-0.5">
                        {studentDetail.student?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                        Courses
                      </p>
                      <p className="text-sm font-bold text-stone-900 mt-1">
                        {studentDetail.total_courses}
                      </p>
                    </div>
                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60">
                      <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                        Account
                      </p>
                      <p className="text-sm font-bold text-stone-900 mt-1">
                        {studentDetail.student?.account_status || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold">
                      Enrolled Courses
                    </h4>
                    {(studentDetail.courses || []).map((entry) => (
                      <div
                        key={`${entry.course?.id}-${entry.enrolled_at}`}
                        className="p-4 rounded-xl border border-stone-200 bg-stone-50/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-serif font-bold text-stone-900 truncate">
                              {entry.course?.title}
                            </p>
                            <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                              Enrolled {formatDate(entry.enrolled_at)}
                            </p>
                          </div>
                          <StatusBadge status={entry.status} />
                        </div>
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-mono text-stone-500 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(entry.completion_percentage || 0)}%</span>
                          </div>
                          <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-600 h-full"
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
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setQuickViewStudent(null)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-white border border-stone-250 w-full max-w-md rounded-2xl shadow-2xl p-6 relative overflow-hidden space-y-4 text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between pb-3.5 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center font-bold text-amber-750 text-sm shrink-0">
                    {initialsFor(quickViewStudent.name)}
                  </div>
                  <div>
                    <h3 className="font-serif font-black text-base text-stone-900">
                      {quickViewStudent.name}
                    </h3>
                    <p className="text-[10px] font-mono text-stone-400 mt-0.5">
                      {quickViewStudent.email}
                    </p>
                  </div>
                </div>
                <CloseButton
                  onClick={() => setQuickViewStudent(null)}
                  className="p-1 border border-stone-200 rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-50 transition shrink-0"
                  iconClassName="w-4 h-4"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100 font-mono text-[10px]">
                <div>
                  <span className="text-stone-400 uppercase block">Courses</span>
                  <span className="text-stone-850 font-bold font-sans block mt-0.5">
                    {quickViewStudent.courses_count}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400 uppercase block">Status</span>
                  <span className="text-stone-850 font-bold block mt-0.5">
                    {quickViewStudent.status}
                  </span>
                </div>
                <div className="col-span-2 pt-2 border-t border-stone-200/50">
                  <span className="text-stone-400 uppercase block">Last Active</span>
                  <span className="font-bold block mt-0.5 text-stone-850">
                    {quickViewStudent.last_activity_at
                      ? formatDate(quickViewStudent.last_activity_at)
                      : "No recorded activity"}
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                    <span className="text-stone-450 uppercase font-semibold">Progress</span>
                    <span className="text-amber-850 font-bold">
                      {Math.round(quickViewStudent.average_progress || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-amber-500 to-amber-700 h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(quickViewStudent.average_progress || 0)}%`,
                      }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center text-[10px] font-mono mb-1.5">
                    <span className="text-stone-450 uppercase font-semibold">Quiz Average</span>
                    <span className="text-emerald-700 font-bold">
                      {Math.round(quickViewStudent.average_score || 0)}%
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
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

              <div className="pt-3 border-t border-stone-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    openStudentDrawer(quickViewStudent.id);
                    setQuickViewStudent(null);
                  }}
                  className="flex-1 py-2 bg-stone-900 hover:bg-stone-850 text-white font-mono text-[10px] uppercase font-bold rounded-lg transition text-center"
                >
                  Open Full Dossier
                </button>
                <button
                  type="button"
                  onClick={() => setQuickViewStudent(null)}
                  className="px-4 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-650 font-mono text-[10px] uppercase font-semibold rounded-lg transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
