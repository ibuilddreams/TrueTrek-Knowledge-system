"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { pathwayImage, shortPathwayName } from "@/data/pathwayImages";
import { spellNumberCapitalised } from "@/lib/numberWords";

// The strip of pathway chips that runs under the hero: "nine pathways, one
// portal", shown rather than claimed.
//
// The track holds the list **twice** and slides exactly -50%, which is what
// makes the loop seamless — at the end of the animation the second copy sits
// precisely where the first began, so the jump back to 0 is invisible. Change
// one of those two things and you must change the other.
//
// It is `aria-hidden` and the chips are not links: a moving target is a poor
// one to click, and every pathway here is reachable from the heading's own
// "See the curriculum" link. That keeps the loop's duplicate copy out of the
// accessibility tree too, instead of announcing all nine pathways twice.
export default function PathwayMarquee({ pathways = [] }) {
  if (pathways.length === 0) return null;

  const chips = pathways.map((pathway) => ({
    id: pathway.id,
    name: shortPathwayName(pathway.name),
    count: pathway.course_count,
    image: pathwayImage(pathway.slug),
  }));

  return (
    <div
      id="pathway-marquee"
      className="group grid grid-cols-1 gap-6 overflow-hidden pt-10"
      aria-label="Pathways"
    >
      <div className="cn-container">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-cn-rule pt-6">
          <p className="text-cn-sm text-cn-muted">
            <b className="font-semibold text-cn-ink">
              {spellNumberCapitalised(pathways.length)} pathways, one portal.
            </b>{" "}
            Every learner starts somewhere different.
          </p>
          <Link
            href={ROUTES.CURRICULUM}
            className="inline-flex items-center gap-1.5 text-cn-sm font-semibold text-cn-accent no-underline"
          >
            See the curriculum
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Faded at both ends so chips arrive and leave rather than being cut. */}
      <div className="cn-marquee-mask">
        <div className="cn-marquee-track flex w-max gap-4" aria-hidden="true">
          {[0, 1].map((copy) =>
            chips.map((chip) => (
              <span
                key={`${copy}-${chip.id}`}
                className="inline-flex items-center gap-3.5 rounded-2xl border border-cn-rule bg-white py-2 pr-[22px] pl-2 whitespace-nowrap transition-colors duration-150 ease-cn-out hover:border-cn-rule-strong"
              >
                <span className="grid h-12 w-12 flex-none place-items-center overflow-hidden rounded-[10px] bg-linear-135 from-cn-paper-3 via-cn-paper-4 to-cn-accent-soft">
                  {chip.image && (
                    <img
                      src={chip.image}
                      alt=""
                      width={96}
                      height={96}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  )}
                </span>
                <b className="text-cn-base font-semibold tracking-[-0.01em] text-cn-ink">
                  {chip.name}
                </b>
                <small className="border-l border-cn-rule pl-3 text-cn-sm tabular-nums text-cn-muted">
                  {chip.count} courses
                </small>
              </span>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
