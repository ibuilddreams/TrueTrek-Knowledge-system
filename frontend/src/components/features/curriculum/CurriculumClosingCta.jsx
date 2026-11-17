"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/constants/routes";

// The design's closing panel for the curriculum page: the same cobalt field
// the homepage closes on, with its own question. Shaped from the design's
// `.cta` — a 7/5 split with the copy left and the actions right, a dot field
// fading in from the left and the mark bled off the bottom-right corner.
export default function CurriculumClosingCta() {
  return (
    <section id="curriculum-closing-cta" className="cn-section">
      <div className="cn-container">
        <div
          data-cn-reveal
          className="cn-reveal cn-cta-dots relative isolate overflow-hidden rounded-cn-xl bg-cn-accent px-6 py-16 shadow-cn-3 md:px-16 md:py-24"
        >
          <img
            src="/images/design/mark-white.png"
            alt=""
            aria-hidden="true"
            width={300}
            height={367}
            className="pointer-events-none absolute -right-[30px] -bottom-[60px] w-[300px] opacity-[0.16]"
          />

          <div className="relative grid items-end gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div>
              <h2 className="max-w-[14ch] text-cn-section font-extrabold tracking-[-0.035em] text-cn-on-ink">
                Not sure where to start?
              </h2>
              <p className="mt-4 text-cn-lg leading-[1.55] text-cn-on-ink-2">
                Apply and an advisor places you in the right pathway.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href={ROUTES.SIGNUP}
                className="inline-flex h-[50px] items-center justify-center gap-2 rounded-cn-sm bg-white px-6 text-cn-base font-semibold text-cn-accent-3 no-underline transition-transform duration-150 ease-cn-out hover:-translate-y-px"
              >
                Apply now
                <ArrowRight className="w-[18px] h-[18px]" />
              </Link>
              <Link
                href={ROUTES.STORE}
                className="inline-flex h-[50px] items-center justify-center rounded-cn-sm border border-white/30 bg-white/12 px-6 text-cn-base font-semibold text-white no-underline transition-colors duration-150 ease-cn-out hover:bg-white/20"
              >
                Browse the store
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
