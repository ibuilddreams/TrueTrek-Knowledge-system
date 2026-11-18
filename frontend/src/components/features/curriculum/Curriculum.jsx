"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import useScrollReveal from "@/hooks/useScrollReveal";
import { getPublicCourseFilters } from "@/services/coursesService";
import { getPublicPathways } from "@/services/pathwaysService";
import CurriculumTierLadder from "./CurriculumTierLadder";
import CurriculumPathwayCards from "./CurriculumPathwayCards";
import CurriculumClosingCta from "./CurriculumClosingCta";

// `/curriculum` is the overview of how the catalog is organised: the nine
// tiers in order, then the pathways that cut across them. It deliberately
// holds no course list — browsing and buying individual courses is the store's
// job, and the design keeps the two apart so this page can answer "how is this
// structured?" without also being a search results screen.
export default function Curriculum() {
  const pageRef = useRef(null);

  // The tiers come from the public course filters, which is where the catalog
  // already publishes them with their level, name and focus.
  const facets = useQuery({
    queryKey: ["curriculum-filters"],
    queryFn: async () => (await getPublicCourseFilters()).data,
  });

  // `/pathways/public/` is paginated, so the array is under `data.results` —
  // the envelope itself is not iterable. Its own cache key rather than the
  // homepage's: two queries sharing a key must agree on the shape they return,
  // and an invariant like that rots the first time one of them is edited.
  const pathwaysQuery = useQuery({
    queryKey: ["curriculum-pathways"],
    queryFn: async () => {
      const response = await getPublicPathways({ pageSize: 100 });
      return response?.data?.results || [];
    },
  });

  const tiers = facets.data?.tiers || [];
  const pathways = pathwaysQuery.data || [];

  // Re-run the reveal sweep as each list arrives, so cards that render after
  // the first pass reveal exactly as the first set did.
  useScrollReveal(pageRef, [tiers.length, pathways.length]);

  return (
    <div
      className="min-h-screen bg-cn-paper text-cn-ink"
      id="curriculum-container"
      ref={pageRef}
    >
      {/* The design's inner-page banner: a paper-2 band carrying a masked dot
          field lit from the top right, with the title and lead on the left and
          a photograph on the right. */}
      <header className="cn-banner relative isolate overflow-hidden bg-cn-paper-2 py-24">
        <div className="cn-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="cn-enter max-w-[14ch] text-cn-display-s font-extrabold tracking-[-0.035em] text-cn-ink">
              The 9-tier curriculum.
            </h1>
            <p
              className="cn-enter mt-6 max-w-[40ch] text-cn-lg leading-[1.5] text-cn-ink-2"
              style={{ "--cn-delay": "90ms" }}
            >
              Nine tiers, from the first plan to a lasting legacy. Every course
              sits in a tier and belongs to one or more pathways.
            </p>
          </div>
          <figure
            className="cn-enter m-0 aspect-4/3 overflow-hidden rounded-cn-lg shadow-cn-3 max-lg:hidden"
            style={{ "--cn-delay": "180ms" }}
          >
            <img
              src="/images/design/path-coolnerds.webp"
              alt="A student studying in a library"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </figure>
        </div>
      </header>

      <CurriculumTierLadder tiers={tiers} />
      <CurriculumPathwayCards pathways={pathways} />
      <CurriculumClosingCta />
    </div>
  );
}
