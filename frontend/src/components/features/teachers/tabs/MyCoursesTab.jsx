"use client";

import { useEffect, useState } from 'react';
import { Users, Eye, AlertCircle, RefreshCw, BookMarked, ChevronDown, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTeacherCourses } from '@/hooks/useTeacherCourses';
import { useTeacherStudentDetail } from '@/hooks/useTeacherStudentDetail';
import CloseButton from '@/components/ui/CloseButton';
import EmptyState from '@/components/ui/EmptyState';

const COURSE_STATUS_STYLES = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-100',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-100',
  ARCHIVED: 'bg-stone-100 text-stone-500 border-stone-200 ring-1 ring-stone-100',
};

const COURSE_STATUS_DOT_STYLES = {
  PUBLISHED: 'bg-emerald-500',
  DRAFT: 'bg-amber-500',
  ARCHIVED: 'bg-stone-400',
};

const ENROLLMENT_STATUS_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-sky-50 text-sky-700 border-sky-200',
  SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-stone-100 text-stone-500 border-stone-200',
};

export default function MyCoursesTab() {
  const {
    stats: assignedCoursesStats,
    withStudents: assignedCoursesWithStudents,
    status: teacherCoursesStatus,
    error: teacherCoursesError,
    loadCourses,
  } = useTeacherCourses();

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const {
    data: studentDetailData,
    status: studentDetailStatus,
    error: studentDetailError,
    loadStudentDetail,
    clearStudentDetail,
  } = useTeacherStudentDetail();

  const [viewingEnrolledStudentId, setViewingEnrolledStudentId] = useState(null);
  const [expandedCourseId, setExpandedCourseId] = useState(null);

  const handleViewEnrolledStudent = (studentId) => {
    setViewingEnrolledStudentId(studentId);
    loadStudentDetail(studentId);
  };

  const handleCloseEnrolledStudent = () => {
    setViewingEnrolledStudentId(null);
    clearStudentDetail();
  };

  return (
    <div className="space-y-6">
      {(teacherCoursesStatus === 'loading' || teacherCoursesStatus === 'idle') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" aria-busy="true" aria-label="Loading assigned courses">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      )}

      {teacherCoursesStatus === 'failed' && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 mb-2">
            Failed to Load Your Courses
          </h2>
          <p className="text-xs text-stone-500 font-light mb-6">{teacherCoursesError}</p>
          <button
            type="button"
            onClick={() => loadCourses({ force: true })}
            className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl shadow-md transition"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {teacherCoursesStatus === 'succeeded' && !(assignedCoursesStats?.total_courses > 0) && (
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm">
          <EmptyState
            icon={BookMarked}
            label="No assigned courses yet"
            description="Courses you've been assigned to teach will appear here along with their enrolled students."
          />
        </div>
      )}

      {teacherCoursesStatus === 'succeeded' && assignedCoursesStats?.total_courses > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {assignedCoursesStats.courses.map((course) => {
            const courseWithStudents = assignedCoursesWithStudents?.courses?.find(
              (entry) => entry.id === course.id
            );
            const roster = courseWithStudents?.students || [];
            const isExpanded = expandedCourseId === course.id;
            const statusStyle = COURSE_STATUS_STYLES[course.status] || COURSE_STATUS_STYLES.DRAFT;

            const enrollmentStatusStyle = (status) =>
              ENROLLMENT_STATUS_STYLES[status] || ENROLLMENT_STATUS_STYLES.CANCELLED;

            return (
              <div
                key={course.id}
                className="group relative self-start w-full bg-white border border-stone-200/90 rounded-2xl shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden transition-all duration-300 hover:shadow-[0_4px_10px_rgba(28,25,23,0.06),0_16px_32px_-14px_rgba(180,83,9,0.18)] hover:border-amber-200/80"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800 opacity-80" />

                <div className="p-6 sm:p-7 pb-4 sm:pb-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105">
                    <Layers className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-serif font-bold text-base text-stone-900 leading-snug truncate">{course.title}</h3>
                        <p className="text-xs text-stone-400 font-light mt-1 truncate">
                          {course.category?.name || 'Uncategorized'}
                        </p>
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full border ${statusStyle}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${COURSE_STATUS_DOT_STYLES[course.status] || COURSE_STATUS_DOT_STYLES.ARCHIVED}`} />
                        {course.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 sm:px-7 pb-6 sm:pb-7">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-stone-50/80 border border-stone-100 px-4 py-3">
                    <div className="flex items-center gap-2 text-stone-600">
                      <div className="w-7 h-7 rounded-lg bg-white border border-stone-200 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                      <span className="text-sm font-serif font-bold text-stone-900">{course.total_students}</span>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">
                        {course.total_students === 1 ? 'Student' : 'Students'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-stone-700 hover:text-amber-800 text-[11px] font-mono font-semibold uppercase tracking-wider rounded-lg shadow-xs transition-colors"
                      title={isExpanded ? 'Hide enrolled students' : 'View enrolled students'}
                      aria-label={isExpanded ? 'Hide enrolled students' : 'View enrolled students'}
                    >
                      {isExpanded ? 'Hide' : 'View'} Students
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50/50 px-5 sm:px-7 py-4">
                    {roster.length === 0 ? (
                      <EmptyState
                        icon={Users}
                        label="No students enrolled yet"
                        description="Once students enroll in this course, they'll show up here."
                        compact
                      />
                    ) : (
                      <ul className="divide-y divide-stone-100/80">
                        {roster.map((enrollment) => (
                          <li
                            key={enrollment.id}
                            className="flex items-center justify-between gap-3 py-2.5 px-2.5 -mx-2.5 rounded-xl transition-colors hover:bg-white hover:shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white to-stone-50 border border-stone-200 flex items-center justify-center font-bold text-stone-600 text-[10px] shadow-xs shrink-0">
                                {enrollment.student.name
                                  ?.split(' ')
                                  .map((part) => part[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase() || 'ST'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-stone-800 truncate">
                                  {enrollment.student.name}
                                </p>
                                <p className="text-[10px] font-mono text-stone-400 mt-0.5 truncate">
                                  {enrollment.student.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <span className={`text-[9px] font-mono font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${enrollmentStatusStyle(enrollment.status)}`}>
                                {enrollment.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleViewEnrolledStudent(enrollment.student.id)}
                                className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-100/60 rounded-lg transition-colors"
                                title="View student's enrollment details"
                                aria-label="View student's enrollment details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {viewingEnrolledStudentId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-sm z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 180 }}
              className="w-full max-w-lg bg-white h-screen shadow-2xl p-6 sm:p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
                <h3 className="font-serif font-black text-xl text-stone-900">Enrolled Student</h3>
                <CloseButton
                  onClick={handleCloseEnrolledStudent}
                  className="p-1.5 border border-stone-200 rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition"
                  iconClassName="w-4.5 h-4.5"
                />
              </div>

              {(studentDetailStatus === 'loading' || studentDetailStatus === 'idle') && (
                <div className="space-y-3">
                  <div className="h-4 bg-stone-100 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-stone-100 rounded w-1/2 animate-pulse" />
                  <div className="h-24 bg-stone-100 rounded animate-pulse" />
                </div>
              )}

              {studentDetailStatus === 'failed' && (
                <div className="text-center py-8">
                  <p className="text-xs text-rose-600 font-medium mb-4">{studentDetailError}</p>
                  <button
                    type="button"
                    onClick={() => loadStudentDetail(viewingEnrolledStudentId)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {studentDetailStatus === 'succeeded' && studentDetailData && (
                <div className="space-y-6">
                  <div>
                    <p className="font-serif font-bold text-lg text-stone-900">
                      {studentDetailData.student.full_name}
                    </p>
                    <p className="text-xs font-mono text-stone-400 mt-0.5">{studentDetailData.student.email}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-stone-400 font-bold mb-3">
                      Enrolled Courses ({studentDetailData.total_courses})
                    </h4>
                    <ul className="space-y-3">
                      {studentDetailData.courses.map((entry, index) => (
                        <li key={entry.course.id || index} className="p-4 rounded-xl border border-stone-100 bg-stone-50/50">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="text-xs font-semibold text-stone-800 truncate">{entry.course.title}</span>
                            <span className="text-[10px] font-mono font-bold text-amber-800 shrink-0">
                              {Math.round(Number(entry.completion_percentage))}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden mb-2">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-800"
                              style={{ width: `${Math.min(Math.max(Number(entry.completion_percentage), 0), 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                            <span>{entry.status}</span>
                            <span>{entry.is_completed ? 'Completed' : 'In Progress'}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
