"use client";

import { useQuery } from "@tanstack/react-query";
import { getMediaKitReview } from "@/services/brandValidatorService";

export const MEDIA_KIT_REVIEW_POLL_MS = 2500;

const TERMINAL_STATUSES = new Set(["COMPLETED", "FAILED"]);

export function isReviewRunning(review) {
  return Boolean(review) && !TERMINAL_STATUSES.has(review.status);
}

/**
 * Polls one review while it's being generated, then stops.
 *
 * The backend runs the critique on a background thread (there is no
 * Celery/Redis in this codebase), so the browser polls the row — the same
 * arrangement AiCourseModal uses for AICourseGeneration. `refetchInterval`
 * returns false once the row reaches a terminal status, which is what stops
 * the polling rather than an effect with a cleared timer.
 */
export function useMediaKitReview(reviewId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["media-kit-review", reviewId],
    queryFn: async () => {
      const response = await getMediaKitReview(reviewId);
      return response?.data || null;
    },
    enabled: enabled && Boolean(reviewId),
    refetchInterval: (query) =>
      isReviewRunning(query.state.data) ? MEDIA_KIT_REVIEW_POLL_MS : false,
  });
}
