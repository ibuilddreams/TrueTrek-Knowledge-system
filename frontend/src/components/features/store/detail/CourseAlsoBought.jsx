"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Plus, Users, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { getPublicCourseRecommendations } from "@/services/coursesService";
import { formatCoursePrice } from "@/lib/store";
import { pluralize } from "@/lib/courseOutline";
import CourseSectionHeading from "./CourseSectionHeading";

const MAX_ITEMS = 5;

// "Students also bought": courses related to this one, then the most
// purchased, minus anything the signed-in student already owns (server-side).
export default function CourseAlsoBought({ courseId }) {
  const { isAuthenticated, isStudent } = useAuth();
  const { isInCart, isPending, toggleCourse } = useCart();
  const canUseCart = !isAuthenticated || isStudent;

  const { data: courses = [] } = useQuery({
    queryKey: ["course-also-bought", courseId],
    queryFn: async () => {
      const response = await getPublicCourseRecommendations({ courseIds: [courseId], limit: 6 });
      const { related = [], popular = [] } = response?.data || {};
      const seen = new Set();
      return [...related, ...popular].filter((course) => {
        if (seen.has(course.id)) return false;
        seen.add(course.id);
        return true;
      });
    },
    staleTime: 60 * 1000,
  });

  const visible = courses.slice(0, MAX_ITEMS);
  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="course-also-bought-heading">
      <CourseSectionHeading
        id="course-also-bought-heading"
        subtitle="Popular picks that pair well with this course."
      >
        Students also bought
      </CourseSectionHeading>
      <ul className="space-y-3">
        {visible.map((course) => {
          const inCart = isInCart(course.id);
          return (
            <li
              key={course.id}
              className="flex items-center gap-4 rounded-card border border-line bg-paper p-4 shadow-soft hover:shadow-elevated hover:border-pine/30 transition-shadow duration-300"
            >
              <Link
                href={`${ROUTES.STORE}/${course.slug}`}
                className="flex flex-1 min-w-0 items-center gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-pine rounded-lg"
              >
                <div className="w-20 h-14 sm:w-24 sm:h-16 shrink-0 overflow-hidden rounded-lg border border-line bg-porcelain">
                  {course.image ? (
                    <img
                      src={course.image}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pine to-ink">
                      <BookOpen className="w-5 h-5 text-gold/70" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-serif tracking-tight text-ink group-hover:text-pine transition-colors line-clamp-2">
                    {course.title}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-muted font-sans">
                    <span>{course.category?.name || "General"}</span>
                    {course.purchase_count > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {pluralize(course.purchase_count, "student")}
                      </span>
                    )}
                  </p>
                </div>
              </Link>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <span className="text-sm font-sans font-semibold text-ink">
                  {formatCoursePrice(course.amount)}
                </span>
                {canUseCart && (
                  <button
                    type="button"
                    onClick={() => toggleCourse(course)}
                    disabled={isPending(course.id)}
                    className={`inline-flex items-center gap-1 text-[10px] font-sans font-medium uppercase tracking-widest px-3 py-1.5 rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed ${
                      inCart
                        ? "bg-sage/60 hover:bg-rose/40 text-moss hover:text-clay"
                        : "bg-pine hover:bg-moss text-paper"
                    }`}
                  >
                    {inCart ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    {inCart ? "Remove" : "Add to cart"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
