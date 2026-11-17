"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEnrollAction } from "@/hooks/useEnrollAction";
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
  const { enroll, enrollModal } = useEnrollAction();

  // Only someone who could actually buy is offered the button: a guest (who
  // signs in through the modal) or a student. A teacher or admin browsing the
  // catalog gets the price and the link, and nothing that leads nowhere.
  const canEnroll = !isAuthenticated || isStudent;

  const { data: courses = [] } = useQuery({
    queryKey: ["course-also-bought", courseId],
    queryFn: async () => {
      const response = await getPublicCourseRecommendations({
        courseIds: [courseId],
        limit: 6,
      });
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
        tone="cobalt"
        id="course-also-bought-heading"
        subtitle="Popular picks that pair well with this course."
      >
        Students also bought
      </CourseSectionHeading>
      <ul className="space-y-3">
        {visible.map((course) => (
          <li
            key={course.id}
            className="flex items-center gap-4 rounded-cn border border-cn-rule bg-white p-4 shadow-cn-1 hover:shadow-cn-3 hover:border-cn-rule-strong transition-shadow duration-300"
          >
            <Link
              href={`${ROUTES.STORE}/${course.slug}`}
              className="flex flex-1 min-w-0 items-center gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cn-accent rounded-lg"
            >
              <div className="w-20 h-14 sm:w-24 sm:h-16 shrink-0 overflow-hidden rounded-lg border border-cn-rule bg-cn-paper-2">
                {course.image ? (
                  <img
                    src={course.image}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[linear-gradient(135deg,var(--color-cn-paper-3),var(--color-cn-paper-4))]">
                    <BookOpen className="w-5 h-5 text-cn-accent" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-[-0.015em] tracking-tight text-cn-ink group-hover:text-cn-accent transition-colors line-clamp-2">
                  {course.title}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] text-cn-muted font-sans">
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
              <span className="text-sm font-sans font-semibold text-cn-ink">
                {formatCoursePrice(course.amount)}
              </span>
              {canEnroll && (
                <button
                  type="button"
                  onClick={() => enroll(course)}
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-cn-sm bg-cn-accent px-3.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-cn-accent-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent"
                >
                  Enroll now
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {enrollModal}
    </section>
  );
}
