"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { getPublicCourseBySlug } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { summarizeOutline } from "@/lib/courseOutline";
import Loader from "@/components/ui/Loader";
import CourseAlsoBought from "./CourseAlsoBought";
import CourseContentAccordion from "./CourseContentAccordion";
import CourseDescription from "./CourseDescription";
import CourseDetailHero from "./CourseDetailHero";
import CourseIncludes from "./CourseIncludes";
import CourseInstructorsSection from "./CourseInstructorsSection";
import CourseLearningOutcomes from "./CourseLearningOutcomes";
import CoursePurchaseCard from "./CoursePurchaseCard";
import CourseRelatedTopics from "./CourseRelatedTopics";
import CourseReviewsSection from "./CourseReviewsSection";

const BACK_LINK =
  "inline-flex items-center gap-2 text-sm font-semibold text-cn-accent-soft no-underline transition-colors duration-150 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent";

// The same link where it sits on paper rather than on the ink band.
const BACK_LINK_ON_PAPER = BACK_LINK.replace("text-cn-accent-soft", "text-cn-accent");

// Full course page opened from a store card (/store/<slug>): hero, sticky
// purchase card, outcomes, outline, description, instructors and suggestions.
export default function StoreCourseDetailPage({ slug }) {
  const query = useQuery({
    queryKey: ["public-course-detail", slug],
    queryFn: async () => (await getPublicCourseBySlug(slug)).data,
    retry: (count, error) => error?.status !== 404 && count < 2,
  });

  const course = query.data;
  const modules = useMemo(() => course?.modules || [], [course]);
  const totals = useMemo(() => summarizeOutline(modules), [modules]);

  let body;

  if (query.isLoading) {
    body = (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy="true">
        <Loader fullScreen={false} tone="cobalt" label="Loading course..." />
      </div>
    );
  } else if (query.isError) {
    const isNotFound = query.error?.status === 404;
    body = (
      <div role="alert" className="rounded-cn-lg border border-cn-rule bg-white p-10 shadow-cn-1">
        <h1 className="text-cn-2xl font-extrabold tracking-[-0.035em] text-cn-ink">
          {isNotFound ? "Course not found" : "Unable to load this course"}
        </h1>
        <p className="mt-3 max-w-[60ch] text-cn-ink-2">
          {isNotFound
            ? "This course may no longer be available. Head back to the store to browse other courses."
            : getApiErrorMessage(query.error, "Please try again.")}
        </p>
        <div className="mt-5 flex items-center gap-4">
          {!isNotFound && (
            <button
              type="button"
              onClick={() => query.refetch()}
              className="text-sm font-semibold text-cn-accent underline"
            >
              Retry
            </button>
          )}
          <Link href={ROUTES.STORE} className={BACK_LINK_ON_PAPER}>
            Browse courses
          </Link>
        </div>
      </div>
    );
  } else if (course) {
    body = (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-12">
        <div className="lg:col-start-1 lg:row-start-1">
          <CourseDetailHero course={course} moduleCount={modules.length} />
        </div>

        <aside className="relative z-10 mt-8 lg:sticky lg:top-[calc(var(--cn-nav-h)+24px)] lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-10 lg:self-start">
          <CoursePurchaseCard course={course} />
        </aside>

        <div className="mt-12 min-w-0 space-y-12 lg:col-start-1 lg:row-start-2">
          <CourseLearningOutcomes outcomes={course.learning_outcomes} />
          <CourseRelatedTopics category={course.category} tags={course.tags} />
          <CourseIncludes course={course} totals={totals} />
          <CourseContentAccordion modules={modules} totals={totals} />
          <CourseDescription description={course.description} />
          <CourseInstructorsSection instructors={course.instructors} />
          <CourseReviewsSection
            courseSlug={course.slug}
            instructorCount={course.instructors?.length || 0}
          />
          <CourseAlsoBought courseId={course.id} />
        </div>
      </div>
    );
  }

  // The back link rides on the hero's ink band when there is a course to
  // show, and on plain paper in the loading and error states.
  const hasHero = Boolean(course) && !query.isLoading && !query.isError;

  return (
    <div
      id="store-course-detail"
      className="min-h-screen overflow-x-clip bg-cn-paper pb-20 text-cn-ink"
    >
      <div className="cn-container">
        <div
          className={`relative isolate pt-8 pb-5 ${
            hasHero
              ? "text-white before:absolute before:inset-y-0 before:-right-[100vw] before:-left-[100vw] before:-z-10 before:bg-cn-ink"
              : ""
          }`}
        >
          {/* With a course on screen the hero's own breadcrumb is the way
              back, and the design has no second link above it; this strip
              then only carries the ink band's top padding. The loading and
              error screens have no breadcrumb, so there it stands in. */}
          {!hasHero && (
            <Link href={ROUTES.STORE} className={BACK_LINK_ON_PAPER}>
              <ArrowLeft className="w-4 h-4" />
              Back to store
            </Link>
          )}
        </div>
        {body}
      </div>
    </div>
  );
}
