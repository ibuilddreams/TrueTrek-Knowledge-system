"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { getPublicCourseRecommendations } from "@/services/coursesService";
import CartRecommendationCard from "@/components/features/cart/CartRecommendationCard";
import CartRecommendationCarousel from "@/components/features/cart/CartRecommendationCarousel";
import PathwaySectionHeading from "./PathwaySectionHeading";

const LIMIT = 8;

// Upsell shelf under the pathway roadmap, built on the same recommendations
// endpoint and cards as the cart's "You might also like". Seeding it with the
// pathway's own course ids means the API treats them like a cart: it returns
// courses sharing their category/tags (best tag overlap first) and excludes
// the pathway's own courses — and any the viewer is already enrolled in — so
// nothing already covered by this bundle is suggested back.
//
// Only the `related` half of the response is used here. The endpoint also
// returns a `popular` ("most purchased") list, which the cart shows as a
// second tab, but on a pathway page a generic best-seller shelf is off-topic:
// if nothing genuinely relates to this pathway, the section stays hidden
// rather than padding itself out.
export default function PathwayRelatedCourses({ pathway }) {
  const { isInCart, isPending, toggleCourse } = useCart();
  const wishlist = useWishlist();

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
      const response = await getPublicCourseRecommendations({ courseIds, limit: LIMIT });
      return response?.data || {};
    },
    staleTime: 60 * 1000,
    // Keep the current shelf on screen while a cart change refetches, so the
    // cards don't flash away when someone adds one.
    placeholderData: (previous) => previous,
  });

  const related = data?.related || [];
  if (related.length === 0) return null;

  return (
    <section id="pathway-related-courses" aria-labelledby="pathway-related-heading">
      <PathwaySectionHeading
        id="pathway-related-heading"
        eyebrow="Go Further"
        subtitle="Courses that pair well with this pathway, drawn from the same subjects and tags."
      >
        Keep building beyond this route
      </PathwaySectionHeading>

      <CartRecommendationCarousel ariaLabel="Courses related to this pathway">
        {related.map((course) => (
          <CartRecommendationCard
            key={course.id}
            course={course}
            isInCart={isInCart(course.id)}
            isPending={isPending(course.id)}
            onToggleCart={toggleCourse}
            isWishlisted={wishlist.isInWishlist(course.id)}
            isWishlistPending={wishlist.isPending(course.id)}
            onToggleWishlist={wishlist.toggleCourse}
            className="shrink-0 snap-start w-[78%] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
          />
        ))}
      </CartRecommendationCarousel>
    </section>
  );
}
