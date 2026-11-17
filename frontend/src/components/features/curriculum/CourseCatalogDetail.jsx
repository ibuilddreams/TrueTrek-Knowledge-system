"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ClipboardList, ListChecks, ChevronDown } from "lucide-react";
import { getPublicCourseBySlug } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import Loader from "@/components/ui/Loader";
import { CourseBanner, CourseBadges } from "./CourseCatalogParts";
import CourseEnrollPanel from "./CourseEnrollPanel";

// One lesson/assignment/quiz list inside an opened module, in the design's
// module-accordion idiom: an accent glyph per row, indented under the summary.
function OutlineGroup({ title, items, icon: Icon }) {
  if (!items?.length) return null;
  return (
    <section className="mt-6 first:mt-0">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-cn-ink"><Icon className="h-4 w-4 text-cn-accent" />{title} ({items.length})</h4>
      <ul className="grid gap-2.5">
        {items.map((item) => <li key={item.id} className="rounded-cn bg-cn-paper-2 p-4">
          <p className="font-semibold text-cn-ink">{item.title}</p>
          {item.description && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-cn-ink-2">{item.description}</p>}
          <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-cn-muted">
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

const CRUMB =
  "inline-flex items-center gap-2 text-sm font-semibold no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent";

export default function CourseCatalogDetail({ slug }) {
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


  return (
    <div className="min-h-screen bg-cn-paper text-cn-ink">
      {query.isLoading || query.isError ? (
        <div className="cn-container py-16 md:py-20">
          <Link href="/curriculum" className={`mb-8 text-cn-accent ${CRUMB}`}><ArrowLeft className="h-4 w-4" />Back to curriculum</Link>
          {query.isLoading ? <div className="py-16"><Loader fullScreen={false} tone="cobalt" label="Loading course details..." /></div> : (
            <div role="alert" className="rounded-cn-lg border border-cn-rule bg-white p-10 shadow-cn-1">
              <h1 className="text-cn-2xl font-extrabold tracking-[-0.035em] text-cn-ink">{query.error?.status === 404 ? "Course not found" : "Unable to load this course"}</h1>
              <p className="mt-3 max-w-[60ch] text-cn-ink-2">{query.error?.status === 404 ? "This course may no longer be published. Return to the catalog to browse available courses." : getApiErrorMessage(query.error, "Please try again.")}</p>
              {query.error?.status !== 404 && <button type="button" onClick={() => query.refetch()} className="mt-4 font-semibold text-cn-accent underline">Retry</button>}
            </div>
          )}
        </div>
      ) : course && (
        <>
          {/* The design's course-detail header: an ink band carrying the
              breadcrumb, the title and the course's meta row, with the
              purchase card below rising into it. */}
          <header className="cn-dark-grid relative isolate overflow-hidden bg-cn-ink py-12 md:py-16">
            <div className="cn-container relative lg:grid lg:grid-cols-12 lg:gap-6">
              <div className="grid content-start gap-5 lg:col-span-8">
                <Link href="/curriculum" className={`text-cn-accent-soft ${CRUMB}`}><ArrowLeft className="h-4 w-4" />Back to curriculum</Link>
                <div className="grid gap-3">
                  <p className="text-sm font-semibold text-cn-accent-soft">{course.category?.name}</p>
                  <h1 className="max-w-[20ch] text-[clamp(2rem,2.4vw_+_1rem,3.25rem)] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance text-white">{course.title}</h1>
                </div>
                <CourseBadges course={course} />
              </div>
            </div>
          </header>

          <div className="cn-container pb-20 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6">
            <main className="grid gap-12 pt-12 lg:col-span-8">
              <p className="max-w-[72ch] leading-relaxed whitespace-pre-line text-cn-ink-2">{course.description || "No description provided."}</p>
              <dl className="grid gap-4 border-t border-cn-rule pt-6 text-sm sm:grid-cols-3">
                <div><dt className="text-cn-muted">Course code</dt><dd className="mt-1 font-semibold break-words text-cn-ink">{course.code}</dd></div>
              </dl>
              <section aria-labelledby="course-syllabus-heading">
                <h2 id="course-syllabus-heading" className="text-cn-2xl font-extrabold tracking-[-0.02em] text-cn-ink">Course curriculum</h2>
                <p className="mt-2 text-sm text-cn-muted">{modules.length} modules · {totals.lessons} lessons · {totals.assignments} assignments · {totals.quizzes} quizzes available on Cool Nerdz</p>
                <div className="mt-6">
                  {modules.length === 0 ? <p className="rounded-cn-lg border border-cn-rule bg-white p-8 text-cn-ink-2 shadow-cn-1">Learning materials have not been added to this course yet.</p> : (
                    /* One bordered box with the modules ruled off from each
                       other, rather than a stack of separate cards. */
                    <div className="overflow-hidden rounded-cn-lg border border-cn-rule bg-white shadow-cn-1">
                      {modules.map((module, index) => (
                        <details key={module.id} open={index === 0} className="group border-t border-cn-rule first:border-t-0">
                          <summary className="flex cursor-pointer list-none items-center gap-4 bg-cn-paper-2 px-6 py-4 transition-colors duration-150 hover:bg-cn-paper-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cn-accent">
                            {/* No numeral chip here: the module title already
                                opens with its own number, and the two read as
                                "01 1. …" side by side. */}
                            <h3 className="min-w-0 flex-1 font-semibold text-cn-ink">{index + 1}. {module.title}</h3>
                            <ChevronDown className="h-5 w-5 shrink-0 text-cn-muted transition-transform duration-200 ease-cn-out group-open:rotate-180" />
                          </summary>
                          <div className="px-6 py-6">
                            <p className="text-sm leading-relaxed whitespace-pre-line text-cn-ink-2">{module.description}</p>
                            <OutlineGroup title="Lessons" icon={BookOpen} items={module.lessons} />
                            <OutlineGroup title="Assignments" icon={ClipboardList} items={module.assignments} />
                            <OutlineGroup title="Quizzes" icon={ListChecks} items={module.quizzes} />
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </main>

            {/* The purchase card. It rises into the ink band above and then
                follows the reader down the module list, which is what the
                design does with it; below the large breakpoint it drops back
                into the flow above the content. */}
            <aside className="relative z-10 pt-8 lg:sticky lg:top-[calc(var(--cn-nav-h)+24px)] lg:col-span-4 lg:-mt-24 lg:pt-0">
              <div className="overflow-hidden rounded-cn-lg border border-cn-rule bg-white shadow-cn-3">
                <CourseBanner course={course} />
                <CourseEnrollPanel course={course} />
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
