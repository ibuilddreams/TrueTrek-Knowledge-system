"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Clock, Layers, RefreshCw, UserRound } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { getCourseById } from "@/services/coursesService";
import { getStudentEnrolledCourseDetail } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatDurationMinutes } from "@/lib/curriculum";
import CloseButton from "@/components/ui/CloseButton";
import EmptyState from "@/components/ui/EmptyState";
import CourseModuleAccordion from "./CourseModuleAccordion";
import NotEnrolledBanner from "./NotEnrolledBanner";

async function fetchCourseDetail(courseId, role) {
  if (role === AUTH_ROLES.STUDENT) {
    try {
      const response = await getStudentEnrolledCourseDetail(courseId);
      const data = response?.data || {};
      return {
        enrolled: true,
        course: data.course || {},
        modules: data.modules || [],
        stats: data.stats || null,
      };
    } catch (error) {
      if (error?.status !== 404) throw error;
      const response = await getCourseById(courseId);
      const course = response?.data || {};
      return { enrolled: false, course, modules: course.modules || [], stats: null };
    }
  }

  const response = await getCourseById(courseId);
  const course = response?.data || {};
  return { enrolled: null, course, modules: course.modules || [], stats: null };
}

export default function CourseDetailPanel({ course: cardCourse, onClose }) {
  const router = useRouter();
  const { isVault } = useTheme();
  const { role } = useAuth();
  const courseId = cardCourse?.id;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["curriculum-course-detail", courseId, role],
    queryFn: () => fetchCourseDetail(courseId, role),
    enabled: Boolean(courseId),
  });

  const course = data?.course || cardCourse || {};
  const modules = data?.modules || [];
  const instructors = course.instructors || [];
  const leadInstructor =
    instructors.find((item) => item.is_lead)?.name || instructors[0]?.name || "Instructor TBD";
  const isNotEnrolledStudent = role === AUTH_ROLES.STUDENT && data?.enrolled === false;

  return (
    <AnimatePresence>
      {cardCourse && (
        <>
          <div
            id="curriculum-drawer-backdrop"
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 transition-opacity"
          />

          <motion.div
            id="curriculum-drawer-surface"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 bottom-0 w-full max-w-lg shadow-2xl z-50 p-6 md:p-8 flex flex-col justify-between overflow-y-auto ${
              isVault ? "bg-[#161412] border-l border-stone-800" : "bg-white"
            }`}
          >
            <div>
              <div
                className={`flex items-center justify-between border-b pb-4 mb-6 ${
                  isVault ? "border-stone-800" : "border-stone-100"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`font-mono text-sm font-bold px-3 py-1.5 rounded-lg border ${
                      isVault
                        ? "text-amber-400 bg-amber-600/15 border-amber-700/40"
                        : "text-amber-800 bg-amber-50 border-amber-200/40"
                    }`}
                  >
                    {course.code || cardCourse.code}
                  </span>
                  <span
                    className={`text-xs uppercase font-mono tracking-widest px-3 py-1 rounded-full border ${
                      isVault
                        ? "bg-stone-900 text-stone-300 border-stone-700"
                        : "bg-stone-50 text-stone-700 border-stone-200"
                    }`}
                  >
                    {course.category?.name || cardCourse.category?.name || "General"}
                  </span>
                </div>
                <CloseButton
                  id="close-curriculum-drawer-btn"
                  onClick={onClose}
                  title="Close course details"
                />
              </div>

              {isLoading && (
                <div className="space-y-4" aria-busy="true">
                  <div className="h-8 w-3/4 rounded-lg bg-stone-100 animate-pulse" />
                  <div className="h-20 rounded-xl bg-stone-100 animate-pulse" />
                  <div className="h-40 rounded-xl bg-stone-100 animate-pulse" />
                </div>
              )}

              {isError && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-rose-600 mb-4">
                    {getApiErrorMessage(error, "Unable to load this course's curriculum.")}
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

              {!isLoading && !isError && (
                <>
                  <h3
                    className={`text-2xl md:text-3xl font-serif font-bold tracking-tight mb-1 ${
                      isVault ? "text-stone-100" : "text-stone-900"
                    }`}
                  >
                    {course.title}
                  </h3>
                  <p
                    className={`font-mono text-xs tracking-wider uppercase mb-4 ${
                      isVault ? "text-stone-400" : "text-stone-500"
                    }`}
                  >
                    {course.difficulty || "General curriculum"}
                  </p>

                  <div
                    className={`border p-4 rounded-xl mb-6 flex items-center gap-3 ${
                      isVault
                        ? "bg-stone-900/40 border-stone-800"
                        : "bg-stone-50 border-stone-200/60"
                    }`}
                  >
                    <UserRound className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <p className="text-stone-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">
                        Lead Instructor
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          isVault ? "text-stone-200" : "text-stone-800"
                        }`}
                      >
                        {leadInstructor}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-sm leading-relaxed mb-6 font-light ${
                      isVault ? "text-stone-400" : "text-stone-600"
                    }`}
                  >
                    {course.description || "No description has been added for this course yet."}
                  </p>

                  {isNotEnrolledStudent && <NotEnrolledBanner />}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers className="w-4 h-4 text-amber-700" />
                      <h4
                        className={`text-xs font-mono uppercase tracking-wider ${
                          isVault ? "text-stone-100" : "text-stone-900"
                        }`}
                      >
                        MODULES & LESSONS
                      </h4>
                    </div>
                    {modules.length === 0 ? (
                      <EmptyState
                        icon={Layers}
                        label="No modules yet"
                        description="This course doesn't have any published modules yet."
                        compact
                      />
                    ) : (
                      <CourseModuleAccordion modules={modules} />
                    )}
                  </div>
                </>
              )}
            </div>

            {!isLoading && !isError && (
              <div
                className={`pt-6 border-t flex items-center justify-between -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 ${
                  isVault ? "border-stone-800 bg-stone-900/40" : "border-stone-100 bg-stone-50"
                }`}
              >
                <div
                  className={`flex items-center gap-2 font-mono text-xs ${
                    isVault ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>
                    DURATION:{" "}
                    <strong className={isVault ? "text-stone-200" : "text-stone-800"}>
                      {formatDurationMinutes(course.duration_minutes)}
                    </strong>
                  </span>
                </div>
                {data?.enrolled ? (
                  <button
                    id="curriculum-continue-learning-btn"
                    onClick={() =>
                      router.push(`${ROUTES.STUDENT_PORTAL}?tab=courses&course=${courseId}`)
                    }
                    className={`font-semibold text-xs px-5 py-2.5 rounded-lg tracking-wide transition ${
                      isVault
                        ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                        : "bg-stone-900 hover:bg-stone-800 text-white"
                    }`}
                  >
                    Continue Learning →
                  </button>
                ) : (
                  <button
                    id="curriculum-drawer-close-btn"
                    onClick={onClose}
                    className={`font-semibold text-xs px-5 py-2.5 rounded-lg tracking-wide transition ${
                      isVault
                        ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                        : "bg-stone-900 hover:bg-stone-800 text-white"
                    }`}
                  >
                    Close
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
