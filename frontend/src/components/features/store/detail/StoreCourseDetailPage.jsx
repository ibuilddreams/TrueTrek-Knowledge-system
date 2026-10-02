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
  "inline-flex items-center gap-2 text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors";

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
        <Loader fullScreen={false} label="Loading course..." />
      </div>
    );
  } else if (query.isError) {
    const isNotFound = query.error?.status === 404;
    body = (
      <div role="alert" className="rounded-card border border-line bg-paper p-8 shadow-soft">
        <h1 className="text-2xl font-serif">
          {isNotFound ? "Course not found" : "Unable to load this course"}
        </h1>
        <p className="mt-3 text-sm text-muted">
          {isNotFound
            ? "This course may no longer be available. Head back to the store to browse other courses."
            : getApiErrorMessage(query.error, "Please try again.")}
        </p>
        <div className="mt-5 flex items-center gap-4">
          {!isNotFound && (
            <button
              type="button"
              onClick={() => query.refetch()}
              className="text-sm font-semibold text-pine underline"
            >
              Retry
            </button>
          )}
          <Link href={ROUTES.STORE} className={BACK_LINK}>
            Browse courses
          </Link>
        </div>
      </div>
    );
  } else if (course) {
    body = (
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-12">
        <div className="lg:col-start-1 lg:row-start-1">
          <CourseDetailHero course={course} />
        </div>

        <aside className="relative z-10 mt-8 lg:mt-10 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start lg:sticky lg:top-24">
          <CoursePurchaseCard course={course} />
        </aside>

        <div className="mt-10 space-y-10 min-w-0 lg:col-start-1 lg:row-start-2">
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

  return (
    <div id="store-course-detail" className="min-h-screen cn-page-bg text-ink pb-24 overflow-x-clip">
      <div className="max-w-6xl mx-auto px-6">
        <div className="pt-8 pb-5">
          <Link href={ROUTES.STORE} className={BACK_LINK}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to store
          </Link>
        </div>
        {body}
      </div>
    </div>
  );
}
