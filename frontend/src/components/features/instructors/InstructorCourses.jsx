"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";

import { useState } from "react";
import CourseSuggestionCard from "@/components/ui/CourseSuggestionCard";
import CourseSectionHeading from "@/components/features/store/detail/CourseSectionHeading";

// "My courses (N)": the instructor's published courses as store cards, with
// the usual cart / wishlist controls, nine at a time (non-student accounts get the standard
// "students only" notice from the hooks).
const PAGE_SIZE = 9;

export default function InstructorCourses({ courses }) {
  const router = useRouter();

  // Enrolling happens in the portal — the same single action the store uses.
  const handleEnroll = (course) =>
    router.push(
      `${ROUTES.STUDENT_PORTAL}?buy=${encodeURIComponent(course.slug)}`,
    );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  if (!courses?.length) return null;

  return (
    <section aria-labelledby="instructor-courses-heading">
      <CourseSectionHeading id="instructor-courses-heading">
        {`My courses (${courses.length})`}
      </CourseSectionHeading>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {courses.slice(0, visibleCount).map((course) => (
          <CourseSuggestionCard
            onEnroll={handleEnroll}
            key={course.id}
            course={course}
            showPopularity
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
