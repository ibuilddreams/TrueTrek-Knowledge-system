"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { LICENSING_FAQS } from "@/data/schoolLicensing";

// "Licensing questions." Native <details>, as the design uses: it opens
// without JavaScript, is findable by the browser's own in-page search, and
// needs no state here.
export default function SchoolsFaq() {
  return (
    <section id="schools-faq" className="cn-section">
      <div className="cn-container grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div data-cn-reveal className="cn-reveal">
          <h2 className="text-cn-section font-extrabold tracking-[-0.035em] text-cn-ink">
            Licensing questions.
          </h2>
          <p className="mt-4 text-cn-lg leading-[1.55] text-cn-muted">
            Anything else is covered in your briefing.
          </p>
          <Link
            href={ROUTES.FAQ}
            className="mt-6 inline-flex items-center gap-1.5 text-cn-sm font-semibold text-cn-accent no-underline hover:underline"
          >
            Read the full FAQ
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div
          data-cn-reveal
          style={{ "--cn-d": 1 }}
          className="cn-reveal grid gap-3"
        >
          {LICENSING_FAQS.map((item) => (
            <details
              key={item.q}
              className="group rounded-cn border border-cn-rule bg-white px-6 py-4 shadow-cn-1 open:shadow-cn-2"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-cn-base font-semibold text-cn-ink [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  aria-hidden="true"
                  className="h-5 w-5 flex-none text-cn-accent transition-transform duration-200 ease-cn-out group-open:rotate-45"
                />
              </summary>
              <p className="mt-3 text-cn-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
