"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { getPublicCourseRecommendations } from "@/services/coursesService";

const LIMIT = 6;

// The design's "More like this" shelf, carrying the same recommendations the
// cart's "You might also like" uses: seeded with this pathway's own course
// ids, so the API returns courses sharing their category and tags and
// excludes the ones this bundle already holds.
//
// The cards are written here rather than reusing `CourseSuggestionCard`,
// which is shared with the instructor page and still on the older palette —
// borrowing it would put porcelain cards inside a cobalt page.
export default function PathwayRelatedCourses({ pathway }) {
  // Sorted so the query key (and cache) doesn't depend on roadmap order.
  const courseIds = useMemo(
    () =>
      (pathway.courses || [])
        .map((entry) => entry.course?.id)
        .filter(Boolean)
        .sort((a, b) => a - b),
    [pathway.courses],
  );

  const { data } = useQuery({
    queryKey: ["pathway-recommendations", courseIds],
    queryFn: async () => {
      const response = await getPublicCourseRecommendations({
        courseIds,
        limit: LIMIT,
      });
      return response?.data || {};
    },
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const related = data?.related || [];
  // Only the `related` half is used. The endpoint also returns `popular`,
  // which on a pathway page is an off-topic best-seller shelf: if nothing
  // genuinely relates, the section stays hidden rather than padding itself.
  if (related.length === 0) return null;

  return (
    <section
      id="pathway-related-courses"
      aria-labelledby="pathway-related-heading"
      className="grid gap-4"
    >
      <h2
        id="pathway-related-heading"
        className="text-cn-2xl font-extrabold tracking-[-0.02em] text-cn-ink"
      >
        More like this
      </h2>
      <p className="max-w-[60ch] text-cn-ink-2">
        Courses that pair well with this pathway, drawn from the same subjects
        and tags.
      </p>

      <div className="mt-2 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((course) => (
          <Link
            key={course.id}
            href={`${ROUTES.STORE}/${course.slug}`}
            className="group flex flex-col overflow-hidden rounded-cn-lg border border-cn-rule bg-white no-underline shadow-cn-1 transition-[border-color,box-shadow,transform] duration-200 ease-cn-out hover:-translate-y-1 hover:border-cn-accent-soft hover:shadow-cn-2"
          >
            <figure className="relative m-0 grid aspect-[4/3] place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--color-cn-paper-3),var(--color-cn-paper-4)_60%,var(--color-cn-accent-soft))]">
              {course.image && (
                <img
                  src={course.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[900ms] ease-cn-out group-hover:scale-[1.04]"
                />
              )}
            </figure>
            <div className="flex flex-1 flex-col gap-2 p-6">
              {course.code && (
                <span className="w-fit rounded-full bg-cn-paper-3 px-2.5 py-1 text-cn-xs font-semibold text-cn-accent-3">
                  {course.code}
                </span>
              )}
              <h3 className="text-cn-lg leading-[1.3] font-bold tracking-[-0.015em] text-cn-ink">
                {course.title}
              </h3>
              {course.category?.name && (
                <span className="text-cn-sm text-cn-ink-2">
                  {course.category.name}
                </span>
              )}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-cn-sm font-semibold text-cn-accent">
                View the course
                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
