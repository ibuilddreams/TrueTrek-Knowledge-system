"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  ClipboardList,
  HelpCircle,
  Layers,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getStudentEnrolledCourseDetail } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDate, formatDateTime } from "@/lib/adminFormatters";
import CloseButton from "@/components/ui/CloseButton";
import StatusBadge from "@/components/ui/StatusBadge";

function ProgressBar({ value }) {
  const progress = Math.round(value || 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-400">
        <span>Overall progress</span>
        <span className="text-amber-800 font-bold">{progress}%</span>
      </div>
      <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            progress >= 80 ? "bg-emerald-500" : "bg-amber-600"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-2.5">
      <p className="text-[9px] font-mono uppercase tracking-wider text-stone-400">
        {label}
      </p>
      <p className="text-base font-serif font-bold text-stone-900 mt-0.5">{value}</p>
    </div>
  );
}

export default function StudentCourseDetailDrawer({ enrollment, onClose }) {
  const courseId = enrollment?.course?.id;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["studentEnrolledCourseDetail", courseId],
    queryFn: async () => {
      const response = await getStudentEnrolledCourseDetail(courseId);
      return response?.data || null;
    },
    enabled: Boolean(courseId),
  });

  const course = data?.course || enrollment?.course || {};
  const detailEnrollment = data?.enrollment || enrollment || {};
  const stats = data?.stats || {};
  const modules = data?.modules || [];
  const instructors = course.instructors || [];
  const leadInstructor =
    instructors.find((item) => item.is_lead)?.name ||
    instructors[0]?.name ||
    "Instructor TBD";

  return (
    <AnimatePresence>
      {enrollment && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-stone-950/35 backdrop-blur-[2px] z-50 flex justify-end"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="w-full max-w-lg bg-[#fcfbfa] h-screen shadow-2xl border-l border-stone-200 overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-[#fcfbfa]/95 backdrop-blur border-b border-stone-200/80 px-5 sm:px-6 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-amber-700/80 mb-1">
                  Course dossier
                </p>
                <h3 className="font-serif font-bold text-xl text-stone-900 leading-tight truncate">
                  {course.title || "Course details"}
                </h3>
              </div>
              <CloseButton
                onClick={onClose}
                className="p-1.5 border border-stone-200 rounded-full text-stone-500 hover:text-stone-900 hover:bg-white transition shrink-0"
                iconClassName="w-4 h-4"
                title="Close course details"
              />
            </div>

            <div className="px-5 sm:px-6 py-6 space-y-6">
              {(isLoading || (!data && !isError)) && (
                <div className="space-y-4" aria-busy="true">
                  <div className="h-20 rounded-2xl bg-stone-100 animate-pulse" />
                  <div className="h-28 rounded-2xl bg-stone-100 animate-pulse" />
                  <div className="h-48 rounded-2xl bg-stone-100 animate-pulse" />
                </div>
              )}

              {isError && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-rose-600 mb-4">
                    {getApiErrorMessage(error, "Unable to load course details.")}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-xs font-mono uppercase rounded-lg"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {data && (
                <>
                  <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                          {course.category?.name || "General"}
                          {course.code ? ` · ${course.code}` : ""}
                        </p>
                        <p className="text-sm text-stone-600 font-light mt-2 leading-relaxed">
                          {course.description ||
                            "No course description has been added yet."}
                        </p>
                      </div>
                      <StatusBadge status={detailEnrollment.status} />
                    </div>

                    <ProgressBar value={stats.completion_percentage} />

                    <div className="grid grid-cols-2 gap-2.5">
                      <StatChip
                        label="Modules"
                        value={`${stats.completed_modules || 0}/${stats.total_modules || 0}`}
                      />
                      <StatChip
                        label="Lessons"
                        value={`${stats.completed_lessons || 0}/${stats.total_lessons || 0}`}
                      />
                      <StatChip label="Quizzes" value={stats.total_quizzes || 0} />
                      <StatChip
                        label="Difficulty"
                        value={course.difficulty || "—"}
                      />
                    </div>

                    <div className="pt-3 border-t border-stone-100 space-y-2.5 text-[12px] text-stone-600">
                      <div className="flex items-center gap-2">
                        <UserRound className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{leadInstructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          Enrolled {formatDate(detailEnrollment.enrolled_at)}
                        </span>
                      </div>
                      {course.duration_minutes ? (
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{course.duration_minutes} minutes total</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-serif font-bold text-stone-900">
                        Modules & lessons
                      </h4>
                      <p className="text-xs text-stone-500 font-light mt-0.5">
                        Your learning path inside this enrolled course.
                      </p>
                    </div>

                    {modules.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-8 text-center">
                        <Layers className="w-5 h-5 text-stone-300 mx-auto mb-2" />
                        <p className="text-xs text-stone-500">
                          No modules have been published for this course yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {modules.map((module) => (
                          <div
                            key={module.id}
                            className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
                                  Module {module.order + 1}
                                </p>
                                <h5 className="font-serif font-bold text-stone-900 mt-0.5 truncate">
                                  {module.title}
                                </h5>
                              </div>
                              <span
                                className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border shrink-0 ${
                                  module.is_completed
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-stone-50 text-stone-500 border-stone-200"
                                }`}
                              >
                                {Math.round(module.completion_percentage || 0)}%
                              </span>
                            </div>

                            {module.description ? (
                              <p className="text-[11px] text-stone-500 font-light leading-relaxed line-clamp-2">
                                {module.description}
                              </p>
                            ) : null}

                            <div className="flex flex-wrap gap-2 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                              <span className="inline-flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {module.stats?.completed_lessons || 0}/
                                {module.stats?.total_lessons || 0} lessons
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <HelpCircle className="w-3 h-3" />
                                {module.stats?.total_quizzes || 0} quizzes
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <ClipboardList className="w-3 h-3" />
                                {module.stats?.total_assignments || 0} assigns
                              </span>
                            </div>

                            {(module.lessons || []).length > 0 && (
                              <div className="space-y-1.5 pt-1 border-t border-stone-100">
                                {module.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="flex items-center gap-2.5 text-[12px] text-stone-700 py-1"
                                  >
                                    {lesson.is_completed ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                                    )}
                                    <span className="truncate flex-1">
                                      {lesson.title}
                                    </span>
                                    {lesson.duration_minutes ? (
                                      <span className="text-[10px] font-mono text-stone-400 shrink-0">
                                        {lesson.duration_minutes}m
                                      </span>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}

                            {(module.assignments || []).length > 0 && (
                              <div className="space-y-1.5 pt-1 border-t border-stone-100">
                                {module.assignments.map((assignment) => (
                                  <div
                                    key={assignment.id}
                                    className="flex items-center justify-between gap-2 text-[12px] text-stone-600"
                                  >
                                    <span className="inline-flex items-center gap-2 min-w-0">
                                      <ClipboardList className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span className="truncate">
                                        {assignment.title}
                                      </span>
                                    </span>
                                    {assignment.due_date ? (
                                      <span className="text-[10px] font-mono text-stone-400 shrink-0">
                                        Due {formatDateTime(assignment.due_date)}
                                      </span>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
