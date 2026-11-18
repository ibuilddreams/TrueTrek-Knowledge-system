"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { getPublicCourseBySlug } from "@/services/coursesService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import Loader from "@/components/ui/Loader";
import CourseContentAccordion from "./CourseContentAccordion";
import CourseDetailHero from "./CourseDetailHero";
import CourseLearningOutcomes from "./CourseLearningOutcomes";
import CourseMoreLikeThis from "./CourseMoreLikeThis";
import CoursePurchaseCard from "./CoursePurchaseCard";
import CourseWhoItsFor from "./CourseWhoItsFor";

// The course page a store card's "View details" opens, laid out as the design
// draws it: an ink band, then an 8fr/4fr body whose right column is the buy
// card — pulled up by `-mt-[249.6px]` so it rises into the band, which is why
// the band's own 4fr column is left empty rather than holding the card.
//
// The negative margin is the design's `calc(var(--space-3xl) * -2.6)`. Below
// 60rem — the design's own breakpoint, not Tailwind's `lg` — both grids drop
// to one column and the card goes back to the top of the flow.
const COLUMNS =
  "grid grid-cols-[minmax(0,8fr)_minmax(0,4fr)] gap-6 max-[60rem]:grid-cols-1";

export default function StoreCourseDetailPage({ slug }) {
  const query = useQuery({
    queryKey: ["public-course-detail", slug],
    queryFn: async () => (await getPublicCourseBySlug(slug)).data,
    retry: (count, error) => error?.status !== 404 && count < 2,
  });

  const course = query.data;
  const modules = useMemo(() => course?.modules || [], [course]);

  if (query.isLoading) {
    return (
      <div className="bg-cn-paper pb-24 text-cn-ink">
        <div className="cn-container flex min-h-[60vh] items-center justify-center" aria-busy="true">
          <Loader fullScreen={false} tone="cobalt" label="Loading course..." />
        </div>
      </div>
    );
  }

  if (query.isError || !course) {
    const isNotFound = query.error?.status === 404;
    return (
      <div className="bg-cn-paper py-16 text-cn-ink">
        <div className="cn-container">
          <Link
            href={ROUTES.STORE}
            className="inline-flex items-center gap-2 text-cn-sm font-semibold text-cn-accent no-underline hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to store
          </Link>
          <div
            role="alert"
            className="mt-6 rounded-cn-lg border border-cn-rule bg-white p-10 shadow-cn-1"
          >
            <h1 className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-cn-ink">
              {isNotFound ? "Course not found" : "Unable to load this course"}
            </h1>
            <p className="mt-3 max-w-[60ch] text-cn-ink-2">
              {isNotFound
                ? "This course may no longer be available. Head back to the store to browse other courses."
                : getApiErrorMessage(query.error, "Please try again.")}
            </p>
            {!isNotFound && (
              <button
                type="button"
                onClick={() => query.refetch()}
                className="mt-5 text-cn-sm font-semibold text-cn-accent underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="store-course-detail" className="overflow-x-clip bg-cn-paper text-cn-ink">
      <header className="bg-cn-ink py-16 text-cn-on-ink">
        <div className={`cn-container ${COLUMNS}`}>
          <CourseDetailHero course={course} moduleCount={modules.length} />
        </div>
      </header>

      <section className="pb-24">
        <div className={`cn-container items-start ${COLUMNS}`}>
          <div className="grid min-w-0 gap-16 pt-16">
            <CourseLearningOutcomes outcomes={course.learning_outcomes} />
            <CourseContentAccordion modules={modules} />
            <CourseWhoItsFor course={course} />
            <CourseMoreLikeThis courseId={course.id} />
          </div>

          <aside className="sticky top-[calc(var(--cn-nav-h)+24px)] mt-[-249.6px] max-[60rem]:static max-[60rem]:order-[-1] max-[60rem]:mt-10">
            <CoursePurchaseCard course={course} hasContent={modules.length > 0} />
          </aside>
        </div>
      </section>
    </div>
  );
}
