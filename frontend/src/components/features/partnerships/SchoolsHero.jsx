"use client";

import { ArrowRight, Check, Palette } from "lucide-react";

const CHECKS = [
  "FERPA and COPPA secure",
  "NCAA bylaws certified",
  "Per-student annual pricing",
];

// The design's `.schero`: copy on the left over a soft bloom, and on the right
// a photograph with two state chips floating over it.
export default function SchoolsHero({ onRequestBriefing, onJumpToEstimator }) {
  return (
    <header className="relative isolate overflow-hidden py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_70%_at_75%_35%,var(--color-cn-paper-3),rgba(234,239,253,0)_70%)]"
      />

      <div className="cn-container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="cn-enter inline-flex h-[34px] items-center gap-2 rounded-full border border-cn-rule bg-white pr-3 pl-1 text-cn-sm font-medium text-cn-ink-2 shadow-cn-1">
            <b className="inline-grid h-[26px] place-items-center rounded-full bg-cn-accent px-2 text-cn-xs font-bold text-white">
              For schools
            </b>
            Cohort licensing
          </span>

          <h1 className="cn-enter mt-6 max-w-[14ch] text-cn-display-s font-extrabold tracking-[-0.035em] text-cn-ink">
            Bring Cool Nerdz to your whole school.
          </h1>

          <p
            className="cn-enter mt-6 max-w-[40ch] text-cn-lg leading-[1.55] text-cn-ink-2"
            style={{ "--cn-delay": "90ms" }}
          >
            The full curriculum and portal for every student, in your colors,
            with counselor reporting built in.
          </p>

          <div
            className="cn-enter mt-10 flex flex-wrap gap-3"
            style={{ "--cn-delay": "180ms" }}
          >
            <button
              type="button"
              onClick={onRequestBriefing}
              className="inline-flex h-[50px] items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
            >
              Request a briefing
              <ArrowRight className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={onJumpToEstimator}
              className="inline-flex h-[50px] items-center justify-center rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink shadow-cn-1 transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink"
            >
              Estimate your licence
            </button>
          </div>

          <ul
            className="cn-enter mt-10 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 text-cn-sm text-cn-ink-2"
            style={{ "--cn-delay": "270ms" }}
          >
            {CHECKS.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-cn-accent" strokeWidth={2.4} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="cn-enter relative py-6 pr-6 max-lg:hidden"
          style={{ "--cn-delay": "180ms", "--cn-dur": "1.1s" }}
        >
          <figure className="m-0 aspect-4/3 overflow-hidden rounded-cn-lg shadow-cn-3">
            <img
              src="/images/design/schools-banner.webp"
              alt="Students and a counselor in a school learning commons"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </figure>

          <div className="cn-float absolute top-[8%] -left-[6%] flex items-center gap-3 rounded-cn border border-cn-rule bg-white px-4 py-3 text-cn-sm whitespace-nowrap shadow-cn-2">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-cn-paper-3 text-cn-accent">
              <Palette className="h-[18px] w-[18px]" />
            </span>
            <span>
              <b className="block text-cn-sm">Your colors, your insignia</b>
              <span className="text-cn-xs text-cn-muted">
                White-label dashboard
              </span>
            </span>
          </div>

          <div
            className="cn-float absolute bottom-[10%] -right-[2%] flex items-center gap-3 rounded-cn border border-cn-rule bg-white px-4 py-3 text-cn-sm whitespace-nowrap shadow-cn-2"
            style={{ animationDelay: "-3s" }}
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-[#fdecec] text-cn-live">
              <span className="cn-livedot h-2 w-2 rounded-full bg-cn-live" />
            </span>
            <span>
              <b className="block text-cn-sm">Counselor alert</b>
              <span className="text-cn-xs text-cn-muted">
                Low activity flagged early
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
