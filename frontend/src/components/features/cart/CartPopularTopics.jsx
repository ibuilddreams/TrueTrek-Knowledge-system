"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/constants/routes";
import { getPublicCourseFilters } from "@/services/coursesService";
import CartRecommendationCarousel from "./CartRecommendationCarousel";

// "Popular Topics" shelf for the empty cart: one chip per subject that has
// published courses, each opening the store filtered to that subject.
export default function CartPopularTopics() {
  const { data: subjects = [] } = useQuery({
    queryKey: ["public-course-filters"],
    queryFn: async () => {
      const response = await getPublicCourseFilters();
      return response?.data?.subjects || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (subjects.length === 0) return null;

  return (
    <section id="cart-popular-topics" className="mt-14 space-y-5" aria-label="Popular topics">
      <h2 className="text-2xl md:text-3xl font-serif font-light tracking-tight text-ink">
        Popular Topics
      </h2>
      <CartRecommendationCarousel ariaLabel="Popular topics">
        {subjects.map((subject) => (
          <li key={subject.id} className="shrink-0 snap-start">
            <Link
              href={`${ROUTES.STORE}?category=${subject.id}`}
              className="block min-w-44 text-center bg-paper border border-line rounded-card shadow-soft hover:shadow-elevated hover:border-pine/30 hover:text-pine px-8 py-5 text-sm font-sans font-medium text-ink transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pine"
            >
              {subject.name}
            </Link>
          </li>
        ))}
      </CartRecommendationCarousel>
    </section>
  );
}
