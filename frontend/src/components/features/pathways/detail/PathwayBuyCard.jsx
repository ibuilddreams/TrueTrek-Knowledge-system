"use client";

import Link from "next/link";
import { Check, Lock } from "lucide-react";
import { formatCoursePrice } from "@/lib/store";
import { pathwayImage } from "@/data/pathwayImages";

// The design's `.cdcard` inside its sticky `.cdbuy` aside: the photograph, the
// price, the one action, and what the bundle contains.
const DIFFICULTY_LABELS = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

const CTA =
  "inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-cn-sm px-6 text-cn-base font-semibold transition-[background-color,transform] duration-150 ease-cn-out";

export default function PathwayBuyCard({ pathway, purchase }) {
  const courseCount = pathway.course_count ?? pathway.courses?.length ?? 0;
  const image = pathwayImage(pathway.slug);

  const included = [
    `${courseCount} course${courseCount === 1 ? "" : "s"}, taken in order`,
    "Every lesson, quiz and assignment inside them",
    "Lifetime access — one payment, no renewal",
    `${DIFFICULTY_LABELS[pathway.difficulty] || "All levels"} starting level, self-paced`,
  ];

  return (
    <div className="overflow-hidden rounded-cn-lg border border-cn-rule bg-white shadow-cn-3">
      <figure className="relative m-0 grid aspect-[16/10] place-items-center overflow-hidden bg-[linear-gradient(135deg,var(--color-cn-paper-3),var(--color-cn-paper-4)_60%,var(--color-cn-accent-soft))]">
        {image && (
          <img src={image} alt="" className="h-full w-full object-cover" />
        )}
      </figure>

      <div className="grid gap-3 p-6">
        <span className="text-cn-xs font-semibold tracking-[0.08em] text-cn-muted uppercase">
          Bundle price
        </span>

        {!purchase.isPriceResolved ? (
          <span aria-hidden="true" className="h-9 w-32 rounded bg-cn-paper-2" />
        ) : purchase.canSeePrice ? (
          <span className="text-cn-3xl font-extrabold tracking-[-0.03em] text-cn-ink tabular-nums">
            {formatCoursePrice(pathway.base_price)}
          </span>
        ) : (
          <button
            type="button"
            onClick={purchase.requestPrice}
            className="inline-flex w-fit items-center gap-2 rounded-cn-sm border border-dashed border-cn-accent-soft bg-cn-paper-3 px-3 py-2 text-cn-sm font-semibold text-cn-accent transition-colors duration-150 hover:bg-cn-paper-4"
          >
            <Lock aria-hidden="true" className="h-4 w-4" />
            Sign in to view price
          </button>
        )}

        <p className="text-cn-sm text-cn-ink-2">
          {courseCount} course{courseCount === 1 ? "" : "s"}, billed once.
        </p>

        {purchase.href ? (
          <Link
            href={purchase.href}
            className={`${CTA} bg-cn-accent text-white shadow-cn-1 hover:-translate-y-px hover:bg-cn-accent-2`}
          >
            {purchase.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={purchase.act}
            disabled={purchase.isDisabled}
            className={`${CTA} bg-cn-accent text-white shadow-cn-1 hover:-translate-y-px hover:bg-cn-accent-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0`}
          >
            {purchase.label}
          </button>
        )}

        {purchase.note && (
          <p className="m-0 text-center text-cn-xs text-cn-muted">{purchase.note}</p>
        )}

        <div className="mt-2 grid gap-3 border-t border-cn-rule pt-4 text-cn-sm">
          <b className="font-bold text-cn-ink">What&apos;s included</b>
          <ul className="m-0 grid list-none gap-2 p-0 text-cn-ink-2">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 flex-none text-cn-accent"
                  strokeWidth={2.4}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
