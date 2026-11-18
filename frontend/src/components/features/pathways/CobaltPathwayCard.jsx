"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";
import { pathwayImage } from "@/data/pathwayImages";
import { usePathwayPricing } from "@/hooks/usePathwayPricing";

// One pathway as the design draws it: photograph, name, what it bundles, then
// a footer of "N courses" against the bundle price and a link into its
// courses. Shared by the curriculum page's grid and the audience pages, so a
// pathway reads identically wherever it is shown.
//
// The price is **not** unconditional. Bundle pricing is shown to signed-in
// accounts only — `usePathwayPricing` is the single rule every pathway
// surface follows, and it has three states, all of which matter: the price,
// a locked chip for a guest, and a neutral gap while the session is still
// being restored (otherwise a signed-in visitor watches the locked chip flash
// before their price arrives).
export default function CobaltPathwayCard({
  pathway,
  revealDelay = 0,
  onRequestSignIn,
}) {
  const { canSeePrice, isResolved } = usePathwayPricing();
  const image = pathwayImage(pathway.slug);

  return (
    <article
      data-cn-reveal
      style={{ "--cn-d": revealDelay }}
      className="cn-reveal group flex flex-col overflow-hidden rounded-cn-lg border border-cn-rule bg-white shadow-cn-1 transition-[transform,box-shadow] duration-200 ease-cn-out hover:-translate-y-1 hover:shadow-cn-3"
    >
      <figure className="m-0 aspect-4/3 overflow-hidden bg-linear-135 from-cn-paper-3 via-cn-paper-4 to-cn-accent-soft">
        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-cn-out group-hover:scale-[1.05]"
          />
        )}
      </figure>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-cn-lg leading-[1.2] font-bold tracking-[-0.015em] text-cn-ink">
          {pathway.name}
        </h3>
        <p className="text-cn-sm text-cn-ink-2">{pathway.summary}</p>

        <div className="flex min-h-[38px] items-center justify-between gap-3 text-cn-sm text-cn-muted">
          <span>{pathway.course_count} courses</span>

          {!isResolved ? (
            <span aria-hidden="true" />
          ) : canSeePrice ? (
            <span className="text-cn-xl leading-[1.55] font-extrabold tracking-[-0.02em] tabular-nums text-cn-ink">
              {formatCoursePrice(pathway.base_price)}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onRequestSignIn?.(pathway)}
              className="inline-flex items-center gap-1.5 rounded-full border border-cn-rule bg-cn-paper-2 px-3 py-1.5 text-cn-xs font-semibold text-cn-ink-2 transition-colors duration-150 hover:border-cn-ink hover:text-cn-ink"
            >
              <Lock aria-hidden="true" className="h-3.5 w-3.5" />
              Sign in to view price
            </button>
          )}
        </div>

        {/* `mt-auto` keeps every card's button on one line however long the
            summary above it runs. */}
        <div className="mt-auto flex gap-2 pt-2">
          <Link
            href={`${ROUTES.PATHWAYS}/${pathway.slug}`}
            className="inline-flex h-[50px] flex-1 items-center justify-center gap-2 rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink no-underline shadow-cn-1 transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink"
          >
            Browse its courses
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
