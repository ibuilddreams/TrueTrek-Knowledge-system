"use client";

import { ArrowRight } from "lucide-react";
import CobaltSectionHead from "@/components/features/home/CobaltSectionHead";
import {
  COUNSELOR_RATIOS,
  LICENCE_LEVELS,
  SEATS_MAX,
  SEATS_MIN,
  SEATS_STEP,
} from "@/data/schoolLicensing";

// "Estimate your annual licence." Controls on the left, the figure on the
// right, recalculated as anything moves.
//
// The state lives in the page rather than here, because the comparison table
// above also sets the level ("Estimate Platinum") and the briefing form below
// reports what was estimated — three places reading one answer.
export default function SchoolsEstimator({
  seats,
  onSeatsChange,
  levelId,
  onLevelChange,
  ratio,
  onRatioChange,
  fee,
  counselors,
  sectionRef,
  onRequestBriefing,
}) {
  const level = LICENCE_LEVELS.find((item) => item.id === levelId);

  return (
    <section id="schools-estimator" ref={sectionRef} className="cn-section scroll-mt-24">
      <div className="cn-container">
        <CobaltSectionHead
          headingId="schools-estimator-heading"
          heading="Estimate your annual licence."
          lead="Move the slider and pick a level. The estimate updates as you go."
        />

        <div
          data-cn-reveal
          className="cn-reveal grid items-start gap-10 lg:grid-cols-2 lg:gap-16"
        >
          <div className="grid gap-6 rounded-cn-lg border border-cn-rule bg-white p-10 shadow-cn-2">
            <div className="grid gap-1">
              <div className="flex justify-between">
                <label htmlFor="schools-seats" className="text-cn-sm font-semibold">
                  Student body
                </label>
                <b className="tabular-nums">{seats.toLocaleString()} students</b>
              </div>
              <input
                id="schools-seats"
                type="range"
                min={SEATS_MIN}
                max={SEATS_MAX}
                step={SEATS_STEP}
                value={seats}
                onChange={(event) => onSeatsChange(Number(event.target.value))}
                className="w-full accent-cn-accent"
              />
              <span className="text-cn-xs text-cn-muted">
                {SEATS_MIN} to {SEATS_MAX.toLocaleString()} students
              </span>
            </div>

            <div className="grid gap-1">
              <span id="schools-level-label" className="text-cn-sm font-semibold">
                Licensing level
              </span>
              <div
                role="radiogroup"
                aria-labelledby="schools-level-label"
                className="grid gap-3"
              >
                {LICENCE_LEVELS.map((item) => {
                  const isChecked = item.id === levelId;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isChecked}
                      onClick={() => onLevelChange(item.id)}
                      className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-cn-sm border-[1.5px] px-6 py-4 text-left transition-[border-color,background-color] duration-150 ease-cn-out ${
                        isChecked
                          ? "border-cn-accent bg-cn-paper-3"
                          : "border-cn-rule bg-white hover:border-cn-accent-soft"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full ${
                          isChecked
                            ? "border-[6px] border-cn-accent"
                            : "border-2 border-cn-rule-strong"
                        }`}
                      />
                      <span>
                        <b className="block">{item.name}</b>
                        <span className="text-cn-sm text-cn-ink-2">{item.tiers}</span>
                      </span>
                      <span className="text-cn-lg leading-[1.55] font-extrabold text-cn-ink tabular-nums">
                        ${item.rate}
                      </span>
                    </button>
                  );
                })}
              </div>
              <span className="text-cn-xs text-cn-muted">Per student, per year</span>
            </div>

            <div className="grid gap-1">
              <label htmlFor="schools-ratio" className="text-cn-sm font-semibold">
                Counselor ratio
              </label>
              <select
                id="schools-ratio"
                value={ratio}
                onChange={(event) => onRatioChange(Number(event.target.value))}
                className="h-[50px] w-full rounded-cn-sm border border-cn-muted bg-white px-4 text-cn-ink transition-colors duration-150 hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent"
              >
                {COUNSELOR_RATIOS.map((value) => (
                  <option key={value} value={value}>
                    1 counselor to {value} students
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            aria-live="polite"
            className="grid content-start gap-6 rounded-cn-lg bg-[linear-gradient(160deg,var(--color-cn-ink),#0b1330)] p-10 text-cn-on-ink shadow-cn-3"
          >
            <span className="text-cn-on-ink-2">Estimated annual fee</span>
            <span className="text-[clamp(3rem,5vw+1rem,5.5rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums">
              ${fee.toLocaleString()}
            </span>
            <span className="text-cn-on-ink-2">{level?.scope}</span>

            <dl className="m-0 grid grid-cols-2 gap-4 border-t border-cn-ink-line pt-6">
              <div>
                <dt className="text-cn-sm text-cn-on-ink-2">Level</dt>
                <dd className="m-0 text-cn-lg leading-[1.55] font-bold">{level?.name}</dd>
              </div>
              <div>
                <dt className="text-cn-sm text-cn-on-ink-2">Per student</dt>
                <dd className="m-0 text-cn-lg leading-[1.55] font-bold tabular-nums">${level?.rate}</dd>
              </div>
              <div>
                <dt className="text-cn-sm text-cn-on-ink-2">Students</dt>
                <dd className="m-0 text-cn-lg leading-[1.55] font-bold tabular-nums">
                  {seats.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-cn-sm text-cn-on-ink-2">Counselors needed</dt>
                <dd className="m-0 text-cn-lg leading-[1.55] font-bold tabular-nums">{counselors}</dd>
              </div>
            </dl>

            <span className="text-cn-on-ink-2">
              White-label theme configuration is quoted separately.
            </span>

            <button
              type="button"
              onClick={onRequestBriefing}
              className="inline-flex h-[50px] w-fit items-center justify-center gap-2 rounded-cn-sm bg-white px-6 text-cn-base font-semibold text-cn-accent-3 transition-transform duration-150 ease-cn-out hover:-translate-y-px"
            >
              Request a licensing briefing
              <ArrowRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
