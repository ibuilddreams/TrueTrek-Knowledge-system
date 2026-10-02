"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Sparkles } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { getPublicCourseRecommendations } from "@/services/coursesService";
import TabNav from "@/components/ui/TabNav";
import CartRecommendationCard from "./CartRecommendationCard";
import CartRecommendationCarousel from "./CartRecommendationCarousel";

const TAB_RELATED = "related";
const TAB_POPULAR = "popular";
const LIMIT = 8;

// "Related to your cart" and "Most purchased" courses, shown under the cart
// (or a single "Learners are viewing" shelf when the cart is empty).
// Courses already in the cart (or already enrolled) are excluded server-side,
// so adding one here moves it into the cart list above and it drops out of
// the suggestions on the next refetch.
export default function CartRecommendations() {
  const { courses: cartCourses, isInCart, isPending, toggleCourse } = useCart();
  const wishlist = useWishlist();
  const [activeTab, setActiveTab] = useState(null);

  // Sorted so the key (and therefore the cache) doesn't depend on cart order.
  const cartIds = useMemo(
    () => cartCourses.map((course) => course.id).sort((a, b) => a - b),
    [cartCourses],
  );

  const { data } = useQuery({
    queryKey: ["cart-recommendations", cartIds],
    queryFn: async () => {
      const response = await getPublicCourseRecommendations({ courseIds: cartIds, limit: LIMIT });
      return response?.data || {};
    },
    staleTime: 60 * 1000,
    // Keep showing the current suggestions while a cart change refetches, so
    // the cards don't flash away when the user adds one.
    placeholderData: (previous) => previous,
  });

  const related = data?.related || [];
  const popular = data?.popular || [];

  const tabs = [
    related.length > 0 && { id: TAB_RELATED, label: "Related to your cart", icon: Sparkles },
    popular.length > 0 && { id: TAB_POPULAR, label: "Most purchased", icon: Flame },
  ].filter(Boolean);

  // Empty cart: a single "Learners are viewing" shelf instead of the tabs.
  const isCartEmpty = cartIds.length === 0;
  if (isCartEmpty ? popular.length === 0 : tabs.length === 0) return null;

  const currentTab = isCartEmpty
    ? TAB_POPULAR
    : tabs.some((tab) => tab.id === activeTab)
      ? activeTab
      : tabs[0].id;
  const visibleCourses = currentTab === TAB_RELATED ? related : popular;

  return (
    <section id="cart-recommendations" className="mt-16 space-y-6" aria-label="Recommended courses">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-serif font-light tracking-tight text-ink">
            {isCartEmpty ? "Learners are viewing" : "You might also like"}
          </h2>
          {!isCartEmpty && (
            <p className="text-sm text-muted font-light">
              {currentTab === TAB_RELATED
                ? "Picked for you based on the courses in your cart."
                : "The most purchased courses across the academy."}
            </p>
          )}
        </div>
        {!isCartEmpty && tabs.length > 1 && (
          <TabNav
            tabs={tabs}
            activeTab={currentTab}
            onChange={setActiveTab}
            ariaLabel="Recommendation type"
          />
        )}
      </div>

      <CartRecommendationCarousel key={currentTab} ariaLabel={`${currentTab} courses`}>
        {visibleCourses.map((course) => (
          <CartRecommendationCard
            key={course.id}
            course={course}
            isInCart={isInCart(course.id)}
            isPending={isPending(course.id)}
            onToggleCart={toggleCourse}
            isWishlisted={wishlist.isInWishlist(course.id)}
            isWishlistPending={wishlist.isPending(course.id)}
            onToggleWishlist={wishlist.toggleCourse}
            showPopularity={currentTab === TAB_POPULAR}
            className="shrink-0 snap-start w-[78%] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
          />
        ))}
      </CartRecommendationCarousel>

    </section>
  );
}
