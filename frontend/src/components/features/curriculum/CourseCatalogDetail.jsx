"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ClipboardList, ListChecks, ChevronDown } from "lucide-react";
import { getPublicCourseBySlug } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import Loader from "@/components/ui/Loader";
import { CourseBanner, CourseBadges } from "./CourseCatalogParts";

function OutlineGroup({ title, items, icon: Icon }) {
  if (!items?.length) return null;
  return (
    <section className="mt-5">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-pine"><Icon className="h-4 w-4" />{title} ({items.length})</h4>
      <ul className="divide-y divide-line rounded-xl border border-line bg-porcelain/50">
        {items.map((item) => <li key={item.id} className="p-4">
          <p className="font-medium">{item.title}</p>
          {item.description && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{item.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            {item.duration_minutes > 0 && <span>{item.duration_minutes} minutes</span>}
            {item.content_type && <span>{item.content_type === "TEXT" ? "Reading lesson" : item.content_type}</span>}
            {item.total_marks != null && <span>{item.total_marks} marks</span>}
            {item.passing_score != null && <span>Passing score: {item.passing_score}%</span>}
            {item.time_limit_minutes > 0 && <span>{item.time_limit_minutes}-minute quiz</span>}
          </div>
        </li>)}
      </ul>
    </section>
  );
}

export default function CourseCatalogDetail({ slug }) {
  const { isAuthenticated, isStudent, role } = useAuth();
  const query = useQuery({
    queryKey: ["public-course-detail", slug],
    queryFn: async () => (await getPublicCourseBySlug(slug)).data,
    retry: (count, error) => error?.status !== 404 && count < 2,
  });
  const course = query.data;
  const modules = course?.modules || [];
  const totals = modules.reduce((result, module) => ({
    lessons: result.lessons + module.lessons.length,
    assignments: result.assignments + module.assignments.length,
    quizzes: result.quizzes + module.quizzes.length,
  }), { lessons: 0, assignments: 0, quizzes: 0 });
  const portalUrl = !isAuthenticated ? ROUTES.LOGIN : isStudent
    ? `${ROUTES.STUDENT_PORTAL}?tab=courses&course=${course?.id}`
    : getPortalRouteForRole(role);

  return (
    <div className="min-h-screen bg-porcelain px-5 py-12 text-ink md:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/curriculum" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-pine"><ArrowLeft className="h-4 w-4" />Back to curriculum</Link>
        {query.isLoading ? <Loader fullScreen={false} label="Loading course details..." /> : query.isError ? (
          <div role="alert" className="rounded-2xl border border-line bg-paper p-8">
            <h1 className="text-2xl font-serif">{query.error?.status === 404 ? "Course not found" : "Unable to load this course"}</h1>
            <p className="mt-3 text-muted">{query.error?.status === 404 ? "This course may no longer be published. Return to the catalog to browse available courses." : getApiErrorMessage(query.error, "Please try again.")}</p>
            {query.error?.status !== 404 && <button type="button" onClick={() => query.refetch()} className="mt-4 text-pine underline">Retry</button>}
          </div>
        ) : course && <>
          <article className="overflow-hidden rounded-2xl border border-line bg-paper">
            <CourseBanner course={course} />
            <div className="space-y-5 p-6 md:p-8">
              <div><p className="mb-2 text-sm font-medium text-pine">{course.category?.name}</p><h1 className="text-3xl font-serif md:text-4xl">{course.title}</h1></div>
              <CourseBadges course={course} />
              <p className="whitespace-pre-line leading-relaxed">{course.description || "No description provided."}</p>
              <dl className="grid gap-4 border-t border-line pt-5 text-sm sm:grid-cols-3">
                <div><dt className="text-muted">Course code</dt><dd className="mt-1 break-words font-medium">{course.code}</dd></div>
              </dl>
            </div>
          </article>
          <section className="mt-10" aria-labelledby="course-syllabus-heading">
            <h2 id="course-syllabus-heading" className="text-2xl font-serif">Course curriculum</h2>
            <p className="mt-2 text-sm text-muted">{modules.length} modules · {totals.lessons} lessons · {totals.assignments} assignments · {totals.quizzes} quizzes available on TrueTrek</p>
            <div className="mt-5 space-y-4">
              {modules.length === 0 ? <p className="rounded-2xl border border-line bg-paper p-6 text-muted">Learning materials have not been added to this course yet.</p> : modules.map((module, index) => (
                <details key={module.id} open={index === 0} className="group rounded-2xl border border-line bg-paper">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 focus-visible:outline-pine"><h3 className="font-semibold">{index + 1}. {module.title}</h3><ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" /></summary>
                  <div className="border-t border-line p-5"><p className="whitespace-pre-line text-sm leading-relaxed text-muted">{module.description}</p><OutlineGroup title="Lessons" icon={BookOpen} items={module.lessons} /><OutlineGroup title="Assignments" icon={ClipboardList} items={module.assignments} /><OutlineGroup title="Quizzes" icon={ListChecks} items={module.quizzes} /></div>
                </details>
              ))}
            </div>
            {modules.length > 0 && <div className="mt-6 rounded-2xl border border-line bg-sage/50 p-6"><h3 className="font-semibold">Continue learning</h3><p className="mt-2 text-sm text-muted">Enrolled students can read the lessons, submit assignments, and take quizzes in their learning portal.</p><Link href={portalUrl} className="mt-4 inline-block rounded-xl bg-pine px-5 py-3 text-sm font-medium text-paper">{isAuthenticated ? "Open learning portal" : "Sign in to learn"}</Link></div>}
          </section>
        </>}
      </div>
    </div>
  );
}
