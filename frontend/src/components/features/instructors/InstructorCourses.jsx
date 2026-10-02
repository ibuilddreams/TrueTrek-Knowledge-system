"use client";

import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import CartRecommendationCard from "@/components/features/cart/CartRecommendationCard";
import CourseSectionHeading from "@/components/features/store/detail/CourseSectionHeading";

// "My courses (N)": the instructor's published courses as store cards, with
// the usual cart / wishlist controls, nine at a time (non-student accounts get the standard
// "students only" notice from the hooks).
const PAGE_SIZE = 9;

export default function InstructorCourses({ courses }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { isInCart, isPending: isCartPending, toggleCourse: toggleCart } = useCart();
  const wishlist = useWishlist();

  if (!courses?.length) return null;

  return (
    <section aria-labelledby="instructor-courses-heading">
      <CourseSectionHeading id="instructor-courses-heading">
        {`My courses (${courses.length})`}
      </CourseSectionHeading>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.slice(0, visibleCount).map((course) => (
          <CartRecommendationCard
            key={course.id}
            course={course}
            isInCart={isInCart(course.id)}
            isPending={isCartPending(course.id)}
            isWishlisted={wishlist.isInWishlist(course.id)}
            isWishlistPending={wishlist.isPending(course.id)}
            showPopularity
            onToggleCart={toggleCart}
            onToggleWishlist={wishlist.toggleCourse}
          />
        ))}
      </ul>
      {courses.length > visibleCount && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="text-xs font-sans font-medium uppercase tracking-widest text-pine hover:text-moss transition"
          >
            Show more courses ({courses.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </section>
  );
}
