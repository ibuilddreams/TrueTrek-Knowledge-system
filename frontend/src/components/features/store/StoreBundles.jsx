"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";
import { getPublicPathways } from "@/services/pathwaysService";
import { pathwayImage, shortPathwayName } from "@/data/pathwayImages";
import { usePathwayPricing } from "@/hooks/usePathwayPricing";

// "Or take a whole pathway" — the row of bundle chips under the store's
// search box, pointing at the curriculum page where every pathway is listed.
//
// The price rides along only when the viewer is allowed to see it:
// bundle pricing is signed-in only, the same rule `CobaltPathwayCard` and
// `PathwayPriceTag` follow. A guest gets the course count alone rather than a
// locked chip — there is no room for one here, and the count is the useful
// half anyway.
const BUNDLE_COUNT = 3;

export default function StoreBundles() {
  const { canSeePrice } = usePathwayPricing();

  const { data: pathways = [] } = useQuery({
    queryKey: ["store-bundles"],
    queryFn: async () => {
      const response = await getPublicPathways({ pageSize: BUNDLE_COUNT });
      return response?.data?.results || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (pathways.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <span className="mr-2 text-cn-sm text-cn-muted">
        Or take a whole pathway
      </span>
      {pathways.map((pathway) => {
        const image = pathwayImage(pathway.slug);
        return (
          <Link
            key={pathway.id}
            href={ROUTES.CURRICULUM}
            className="inline-flex items-center gap-3 rounded-[14px] border border-cn-rule bg-white py-1.5 pr-4 pl-1.5 text-left text-cn-ink no-underline transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-accent-soft"
          >
            <span className="h-10 w-10 flex-none overflow-hidden rounded-[10px] bg-linear-135 from-cn-paper-3 via-cn-paper-4 to-cn-accent-soft">
              {image && (
                <img
                  src={image}
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </span>
            <span>
              <b className="block text-cn-sm font-bold">
                {shortPathwayName(pathway.name)} Pathway
              </b>
              <small className="text-cn-xs text-cn-muted">
                {pathway.course_count} courses
                {canSeePrice ? ` · ${formatCoursePrice(pathway.base_price)}` : ""}
              </small>
            </span>
            <ArrowRight className="h-4 w-4 text-cn-accent" />
          </Link>
        );
      })}
    </div>
  );
}
