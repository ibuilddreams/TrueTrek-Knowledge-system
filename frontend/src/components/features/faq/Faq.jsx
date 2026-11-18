"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { FAQ_CATEGORIES } from "@/constants/faq";
import { USER_GUIDES } from "@/constants/userGuides";
import { ROUTES } from "@/constants/routes";
import useScrollReveal from "@/hooks/useScrollReveal";
import CobaltSectionHead from "@/components/features/home/CobaltSectionHead";
import ContactAdvisorEntry from "./ContactAdvisorEntry";

// The FAQ: every question on the page at once, grouped under its category,
// with each category heading held beside its own questions.
//
// There is deliberately no search box or filter rail. Everything is on the
// page, so the browser's own in-page find covers it — which is what people
// reach for anyway — and native <details> means a question opens without
// JavaScript and is findable by that search even while closed.
export default function Faq() {
  const pageRef = useRef(null);
  useScrollReveal(pageRef, []);

  return (
    <div
      id="faq-page-container"
      ref={pageRef}
      className="min-h-screen bg-cn-paper text-cn-ink"
    >
      {/* The design's `.banner.solo`: the title on the left over seven
          columns, the lead on the right over five, baselines aligned. */}
      <header className="cn-banner relative isolate overflow-hidden bg-cn-paper-2 py-24">
        <div className="cn-container grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end">
          <h1 className="cn-enter text-cn-display-s font-extrabold tracking-[-0.035em] text-cn-ink">
            Questions, answered.
          </h1>
          <p
            className="cn-enter max-w-[40ch] text-cn-lg leading-[1.5] text-cn-ink-2"
            style={{ "--cn-delay": "90ms" }}
          >
            Curriculum, admissions, school licensing, the portal and billing.
            The questions families and schools ask most.
          </p>
        </div>
      </header>

      <section id="faq-categories" className="cn-section">
        <div className="cn-container">
          {FAQ_CATEGORIES.map((category) => (
            <div
              key={category.id}
              id={`faq-category-${category.id}`}
              data-cn-reveal
              className="cn-reveal grid gap-6 border-t border-cn-rule py-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]"
            >
              <h2 className="max-w-[14ch] text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
                {category.label}
              </h2>

              <div>
                {category.items.map((item) => (
                  <details
                    key={item.question}
                    className="group mb-3 rounded-cn border border-cn-rule bg-white transition-shadow duration-200 ease-cn-out open:border-cn-paper-4 open:shadow-cn-2"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 p-6 text-cn-lg leading-[1.55] font-semibold [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-cn-paper-3 text-cn-accent transition-transform duration-200 ease-cn-out group-open:rotate-45">
                        <Plus aria-hidden="true" className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="max-w-[65ch] px-6 pb-6 text-cn-ink-2">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq-guides" className="cn-section">
        <div className="cn-container">
          <CobaltSectionHead
            headingId="faq-guides-heading"
            heading="Step-by-step guides."
            lead="Two walkthroughs in plain language. Keep the portal open beside them."
          />

          <div className="grid gap-6 sm:grid-cols-2">
            {USER_GUIDES.map((guide, index) => {
              const steps = guide.chapters.reduce(
                (total, chapter) => total + (chapter.steps?.length || 0),
                0,
              );
              return (
                <article
                  key={guide.id}
                  data-cn-reveal
                  style={{ "--cn-d": index }}
                  className="cn-reveal flex flex-col overflow-hidden rounded-cn-lg border border-cn-rule bg-white shadow-cn-1 transition-[transform,box-shadow] duration-200 ease-cn-out hover:-translate-y-1 hover:shadow-cn-3"
                >
                  {/* The design's `.ctop`: a tinted band carrying the audience
                      and the size of the guide, with one large ring bled off
                      the top-right corner. The counts are read from
                      `USER_GUIDES` rather than written here, so they stay true
                      as chapters are added. */}
                  <div className="relative flex h-[120px] items-end justify-between overflow-hidden bg-cn-paper-3 p-6">
                    <span
                      aria-hidden="true"
                      className="absolute -top-[30px] -right-[30px] h-[140px] w-[140px] rounded-full border-[24px] border-white/35"
                    />
                    <b className="relative text-cn-2xl leading-[1.55] font-extrabold tracking-[-0.03em] text-cn-accent-3">
                      {guide.shortLabel}
                    </b>
                    <span className="relative rounded-full bg-white/80 px-2.5 py-1 text-cn-xs font-semibold text-cn-accent-3">
                      {guide.chapters.length} chapters, {steps} steps
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <h3 className="text-cn-lg leading-[1.2] font-bold tracking-[-0.015em] text-cn-ink">
                      {guide.label}
                    </h3>
                    <p className="text-cn-sm text-cn-ink-2">{guide.audience}</p>
                    <div className="mt-auto flex gap-2 pt-2">
                      <Link
                        href={
                          guide.id === "teacher"
                            ? ROUTES.TEACHER_PORTAL
                            : ROUTES.STUDENT_PORTAL
                        }
                        className="inline-flex h-[50px] flex-1 items-center justify-center gap-2 rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink no-underline shadow-cn-1 transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink"
                      >
                        Open the portal
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="faq-cta-section" className="cn-section">
        <div className="cn-container">
          <div
            id="faq-cta-card"
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
                  Still have a question?
                </h2>
                <p className="mt-4 text-cn-lg leading-[1.55] text-cn-on-ink-2">
                  Ask an advisor and get a reply in your Cool Nerdz Portal
                  within one business day.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <ContactAdvisorEntry
                  id="btn-faq-cta-ask-advisor"
                  icon={ArrowRight}
                  className="inline-flex h-[50px] items-center justify-center gap-2 rounded-cn-sm bg-white px-6 text-cn-base font-semibold text-cn-accent-3 transition-transform duration-150 ease-cn-out hover:-translate-y-px"
                />
                <Link
                  id="btn-faq-cta-curriculum"
                  href={ROUTES.CURRICULUM}
                  className="inline-flex h-[50px] items-center justify-center rounded-cn-sm border border-white/30 bg-white/12 px-6 text-cn-base font-semibold text-white no-underline transition-colors duration-150 ease-cn-out hover:bg-white/20"
                >
                  Browse the curriculum
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
