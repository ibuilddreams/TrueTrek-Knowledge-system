"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { getInstructorFeedback } from "@/services/instructorsService";
import { pluralize } from "@/lib/courseOutline";
import CartRecommendationCarousel from "@/components/features/cart/CartRecommendationCarousel";
import CourseSectionHeading from "@/components/features/store/detail/CourseSectionHeading";
import InstructorFeedbackCard from "./InstructorFeedbackCard";
import InstructorFeedbackForm from "./InstructorFeedbackForm";

const PAGE_SIZE = 12;

// "What people say": rating summary, a swipeable carousel of feedback (more
// loads on demand) and the student feedback form.
export default function InstructorFeedbackSection({ instructor }) {
  const { stats } = instructor;

  const query = useInfiniteQuery({
    queryKey: ["instructor-feedback", instructor.id],
    queryFn: async ({ pageParam }) =>
      (await getInstructorFeedback(instructor.id, { page: pageParam, pageSize: PAGE_SIZE }))?.data,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => (lastPage?.next ? pages.length + 1 : undefined),
  });

  const feedback = (query.data?.pages || []).flatMap((page) => page?.results || []);

  return (
    <section aria-labelledby="instructor-feedback-heading" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <CourseSectionHeading id="instructor-feedback-heading">What people say</CourseSectionHeading>
        {stats.rating != null && (
          <p className="mb-5 inline-flex items-center gap-2 text-sm text-ink">
            <Star className="w-4 h-4 fill-gold text-gold" aria-hidden="true" />
            <span className="font-semibold">{stats.rating.toFixed(1)}</span>
            <span className="text-muted">· {pluralize(stats.reviews, "review")}</span>
          </p>
        )}
      </div>

      {query.isLoading ? (
        <p className="text-sm text-muted" aria-busy="true">
          Loading feedback…
        </p>
      ) : query.isError ? (
        <p className="text-sm text-muted">
          Couldn&apos;t load feedback.{" "}
          <button type="button" onClick={() => query.refetch()} className="font-semibold text-pine underline">
            Retry
          </button>
        </p>
      ) : feedback.length === 0 ? (
        <p className="rounded-card border border-dashed border-line bg-paper/70 px-6 py-5 text-sm text-muted">
          No feedback yet. Be the first to share your experience.
        </p>
      ) : (
        <>
          <CartRecommendationCarousel ariaLabel="Student feedback">
            {feedback.map((item) => (
              <InstructorFeedbackCard
                key={item.id}
                feedback={item}
                className="shrink-0 snap-start w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]"
              />
            ))}
          </CartRecommendationCarousel>
          {query.hasNextPage && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
                className="text-xs font-sans font-medium uppercase tracking-widest text-pine hover:text-moss disabled:opacity-60 transition"
              >
                {query.isFetchingNextPage ? "Loading..." : "Load more feedback"}
              </button>
            </div>
          )}
        </>
      )}

      <InstructorFeedbackForm instructor={instructor} />
    </section>
  );
}
