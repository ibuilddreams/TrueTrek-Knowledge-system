"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AlertCircle, BookOpen, CheckCircle, LogIn, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { getPublicCourses } from "@/services/coursesService";
import { getStudentEnrollments } from "@/services/studentCoursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import SectionHeading from "@/components/ui/SectionHeading";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";
import Pagination from "@/components/ui/Pagination";
import CurriculumFilterBar from "./CurriculumFilterBar";
import CourseTierCard from "./CourseTierCard";
import CourseDetailPanel from "./CourseDetailPanel";
import CurriculumLoginPrompt from "./CurriculumLoginPrompt";

const PAGE_SIZE = 9;

export default function Curriculum() {
  const router = useRouter();
  const { isVault } = useTheme();
  const { isAuthenticated, role, user } = useAuth();

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [page, setPage] = useState(1);
  const [activeCourse, setActiveCourse] = useState(null);
  const [loginPromptCourse, setLoginPromptCourse] = useState(null);

  const onNavigateToPortal = () => router.push(getPortalRouteForRole(role));

  function handleSelectCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    setPage(1);
  }

  // Paginated, server-filtered by category — the API call carries `page` and
  // `category` as query params so the backend does the filtering, not the client.
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["curriculum-public-courses", page, selectedCategoryId],
    queryFn: async () => {
      const response = await getPublicCourses({
        page,
        pageSize: PAGE_SIZE,
        category: selectedCategoryId || undefined,
      });
      return response?.data || { results: [], count: 0 };
    },
    placeholderData: keepPreviousData,
  });

  const courses = data?.results || [];
  const totalCourses = data?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCourses / PAGE_SIZE));

  // Independent, unfiltered fetch used only to populate the filter tabs — the
  // paginated/category-filtered query above can't be used for this, since once
  // a category is selected its results would only ever contain that category.
  const { data: categorySourceCourses = [] } = useQuery({
    queryKey: ["curriculum-categories-source"],
    queryFn: async () => {
      const response = await getPublicCourses({ pageSize: 100 });
      return response?.data?.results || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Only students carry an enrollment concept — admins/teachers/faculty browse
  // the catalog without a per-course locked/unlocked state.
  const { data: enrollments = [] } = useQuery({
    queryKey: ["studentEnrollments"],
    queryFn: async () => {
      const response = await getStudentEnrollments({ page: 1, pageSize: 100 });
      return response?.data?.results || [];
    },
    enabled: role === AUTH_ROLES.STUDENT,
  });

  const enrollmentByCourseId = useMemo(() => {
    const map = new Map();
    enrollments.forEach((item) => {
      if (item.course?.id) map.set(item.course.id, item);
    });
    return map;
  }, [enrollments]);

  function getEnrollmentStatus(courseId) {
    if (role !== AUTH_ROLES.STUDENT) return null;
    const enrollment = enrollmentByCourseId.get(courseId);
    if (!enrollment) return "LOCKED";
    if (enrollment.is_completed) return "COMPLETED";
    if (enrollment.status === "ACTIVE") return "IN_PROGRESS";
    return null;
  }

  const categories = useMemo(() => {
    const map = new Map();
    categorySourceCourses.forEach((course) => {
      if (course.category?.id) map.set(course.category.id, course.category);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categorySourceCourses]);

  function handleCardClick(course) {
    if (!isAuthenticated) {
      setLoginPromptCourse(course);
      return;
    }
    setActiveCourse(course);
  }

  return (
    <div
      id="curriculum-container"
      className={`py-16 px-6 min-h-screen transition-colors duration-300 ${
        isVault ? "bg-[#0c0b0a]" : "bg-[#faf9f6]"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          className="mb-12"
          eyebrow="Modular Framework Structure"
          eyebrowClassName={isVault ? "text-amber-500" : "text-amber-700"}
          heading="Curriculum"
          headingClassName={`text-4xl md:text-5xl font-serif font-semibold tracking-tight ${
            isVault ? "text-stone-100" : "text-stone-900"
          }`}
          subtitle="Explore every course on TrueTrek Learning, browse each module and lesson inside, and pick up right where you left off."
          subtitleClassName={`text-sm max-w-2xl mx-auto font-light leading-relaxed mb-4 ${
            isVault ? "text-stone-400" : "text-stone-600"
          }`}
        />

        {isAuthenticated ? (
          <div
            id="curriculum-session-banner"
            className={`border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isVault ? "bg-emerald-900/20 border-emerald-800/40" : "bg-emerald-50/70 border-emerald-200/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isVault ? "bg-emerald-600/15 text-emerald-400" : "bg-emerald-600/10 text-emerald-700"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={`text-xs font-mono font-bold uppercase tracking-wide ${
                    isVault ? "text-emerald-300" : "text-emerald-800"
                  }`}
                >
                  Signed In
                </p>
                <p
                  className={`text-[11px] font-light mt-0.5 ${
                    isVault ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  Signed in as {user?.name || user?.email}. Open a course below to view its full
                  curriculum and track progress.
                </p>
              </div>
            </div>
            <button
              id="goto-portal-btn"
              onClick={onNavigateToPortal}
              className="text-[10px] font-mono font-semibold uppercase bg-emerald-700 hover:bg-emerald-850 text-white px-4 py-2 rounded-lg transition duration-200 shadow-sm self-start sm:self-auto shrink-0"
            >
              Open My Portal →
            </button>
          </div>
        ) : (
          <div
            id="curriculum-session-banner"
            className={`border rounded-2xl p-4 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isVault ? "bg-stone-900/40 border-stone-800" : "bg-stone-50 border-stone-200/80"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isVault ? "bg-amber-600/15 text-amber-500" : "bg-amber-600/10 text-amber-750"
                }`}
              >
                <LogIn className="w-4 h-4" />
              </div>
              <div>
                <p
                  className={`text-xs font-mono font-bold uppercase tracking-wide ${
                    isVault ? "text-amber-400" : "text-amber-900"
                  }`}
                >
                  Browsing as Guest
                </p>
                <p
                  className={`text-[11px] font-light mt-0.5 ${
                    isVault ? "text-stone-400" : "text-stone-500"
                  }`}
                >
                  Log in to open a course's full curriculum, track enrollment progress, and
                  continue lessons.
                </p>
              </div>
            </div>
            <button
              id="goto-login-btn"
              onClick={() => router.push(ROUTES.LOGIN)}
              className={`text-[10px] font-mono font-semibold uppercase px-4 py-2 rounded-lg transition duration-200 shadow-sm self-start sm:self-auto shrink-0 ${
                isVault
                  ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                  : "bg-stone-900 hover:bg-stone-800 text-white"
              }`}
            >
              Sign In
            </button>
          </div>
        )}

        <CurriculumFilterBar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelect={handleSelectCategory}
        />

        {isLoading && (
          <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
            <Loader fullScreen={false} label="Loading curriculum..." />
          </div>
        )}

        {isError && (
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
              Failed to Load Curriculum
            </h2>
            <p className={`text-xs font-light mb-6 ${isVault ? "text-stone-400" : "text-stone-500"}`}>
              {getApiErrorMessage(error, "Unable to load the curriculum right now.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className={`inline-flex items-center gap-2 px-5 py-3 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition ${
                isVault
                  ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
                  : "bg-stone-900 hover:bg-stone-800 text-stone-100"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && courses.length === 0 && (
          <div
            className={`rounded-2xl border border-dashed ${
              isVault ? "border-stone-700 bg-[#161412]/70" : "border-stone-200 bg-white/70"
            }`}
          >
            <EmptyState
              icon={BookOpen}
              label={selectedCategoryId === null ? "No courses published yet" : "No matching courses"}
              description={
                selectedCategoryId === null
                  ? "Check back soon — new courses are added regularly."
                  : "Try selecting a different category filter."
              }
            />
          </div>
        )}

        {!isLoading && !isError && courses.length > 0 && (
          <>
            <motion.div
              id="tiers-cards-grid"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-200 ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {courses.map((course) => (
                <CourseTierCard
                  key={course.id}
                  course={course}
                  enrollmentStatus={getEnrollmentStatus(course.id)}
                  onClick={() => handleCardClick(course)}
                />
              ))}
            </motion.div>

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              totalLabel={`${totalCourses} course${totalCourses === 1 ? "" : "s"}`}
            />
          </>
        )}

        <CourseDetailPanel course={activeCourse} onClose={() => setActiveCourse(null)} />
        <CurriculumLoginPrompt
          course={loginPromptCourse}
          onClose={() => setLoginPromptCourse(null)}
        />
      </div>
    </div>
  );
}
