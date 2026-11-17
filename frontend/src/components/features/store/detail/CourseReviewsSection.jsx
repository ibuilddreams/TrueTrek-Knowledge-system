"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { getCourseFeedback } from "@/services/instructorsService";
import { pluralize } from "@/lib/courseOutline";
import CourseReviewItem from "./CourseReviewItem";

const PAGE_SIZE = 6;

// "★ 4.7 course rating • 545 ratings" followed by what students said about the
// course's instructors. Hidden until at least one student has left feedback.
export default function CourseReviewsSection({ courseSlug, instructorCount }) {
  const query = useInfiniteQuery({
    queryKey: ["course-feedback", courseSlug],
    queryFn: async ({ pageParam }) =>
      (await getCourseFeedback(courseSlug, { page: pageParam, pageSize: PAGE_SIZE }))?.data,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage?.next ? pages.length + 1 : undefined),
  });

  const summary = query.data?.pages?.[0]?.summary;
  const reviews = (query.data?.pages || []).flatMap((page) => page?.results || []);

  if (!summary || summary.reviews === 0) return null;

  return (
    <section aria-labelledby="course-reviews-heading">
      <h2
        id="course-reviews-heading"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl md:text-3xl font-bold tracking-[-0.015em] tracking-tight text-cn-ink"
      >
        <Star className="w-7 h-7 fill-cn-accent text-cn-accent" aria-hidden="true" />
        <span>{summary.rating.toFixed(1)} course rating</span>
        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-cn-muted" />
        <span>{pluralize(summary.reviews, "rating")}</span>
      </h2>

      <ul className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
        {reviews.map((review) => (
          <CourseReviewItem key={review.id} review={review} showInstructor={instructorCount > 1} />
        ))}
      </ul>

      {query.hasNextPage && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="inline-flex h-11 items-center justify-center rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-sm font-semibold text-cn-ink shadow-cn-1 transition-colors duration-150 enabled:hover:border-cn-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {query.isFetchingNextPage ? "Loading..." : "Show more reviews"}
          </button>
        </div>
      )}
    </section>
  );
}
