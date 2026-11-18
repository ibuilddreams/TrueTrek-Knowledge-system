"use client";

import { useQuery } from "@tanstack/react-query";
import { useEnrollAction } from "@/hooks/useEnrollAction";
import { getPublicCourseRecommendations } from "@/services/coursesService";
import StoreCourseCard from "@/components/features/store/StoreCourseCard";

const MAX_ITEMS = 3;

// The design's "More like this" (`.cdsec` + `.cgrid.cdrel`): the store's own
// course card, one per row rather than the grid's two, because this column is
// 8fr wide and a two-up row here would be a different card from the one the
// visitor just clicked on the store.
//
// Related courses first, then the most purchased, minus anything the signed-in
// student already owns — the server does that filtering.
export default function CourseMoreLikeThis({ courseId }) {
  const { enroll, enrollModal } = useEnrollAction();

  const { data: courses = [] } = useQuery({
    queryKey: ["course-more-like-this", courseId],
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
    <section aria-labelledby="course-more-like-this-heading" className="grid gap-4">
      <h2
        id="course-more-like-this-heading"
        className="max-w-[20ch] text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-balance text-cn-ink"
      >
        More like this
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {visible.map((course, index) => (
          <StoreCourseCard
            key={course.id}
            course={course}
            onRequestEnroll={enroll}
            revealDelay={index}
          />
        ))}
      </div>

      {enrollModal}
    </section>
  );
}
