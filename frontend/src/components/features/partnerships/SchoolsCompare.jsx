"use client";

import { Check, Minus } from "lucide-react";
import CobaltSectionHead from "@/components/features/home/CobaltSectionHead";
import { COMPARE_ROWS, LICENCE_LEVELS } from "@/data/schoolLicensing";

// "Compare licensing levels." A real table — a feature matrix read across rows
// and down columns is what tables are for, and it keeps the row header tied to
// its cells for a screen reader. It scrolls horizontally rather than
// collapsing, with a minimum width so the columns never crush together.
export default function SchoolsCompare({ onEstimate }) {
  return (
    <section id="schools-compare" className="cn-section">
      <div className="cn-container">
        <CobaltSectionHead
          headingId="schools-compare-heading"
          heading="Compare licensing levels."
          lead="Priced per student, per year. White-label theme configuration is quoted separately."
        />

        <div
          data-cn-reveal
          className="cn-reveal overflow-x-auto rounded-cn-lg border border-cn-rule bg-white shadow-cn-1"
        >
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                {LICENCE_LEVELS.map((level) => (
                  <th
                    key={level.id}
                    scope="col"
                    className={`px-6 pt-10 pb-6 align-bottom ${
                      level.popular ? "border-t-[3px] border-cn-accent" : ""
                    }`}
                  >
                    <b className="block text-cn-lg">{level.name}</b>
                    <span className="mt-2 block text-cn-3xl leading-[1.55] font-extrabold tracking-[-0.03em] tabular-nums">
                      ${level.rate}
                    </span>
                    <small className="text-cn-xs font-medium text-cn-muted">
                      per student / year
                    </small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <th
                    scope="row"
                    className="border-b border-cn-rule px-6 py-4 text-left text-cn-sm font-medium text-cn-ink-2"
                  >
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td
                      key={LICENCE_LEVELS[index].id}
                      className={`border-b border-cn-rule px-6 py-4 text-center ${
                        LICENCE_LEVELS[index].popular ? "bg-cn-paper-3" : ""
                      }`}
                    >
                      {value === true ? (
                        <>
                          <Check
                            aria-hidden="true"
                            className="inline h-[18px] w-[18px] text-cn-accent"
                            strokeWidth={2.6}
                          />
                          <span className="sr-only">Included</span>
                        </>
                      ) : value === false ? (
                        <>
                          <Minus
                            aria-hidden="true"
                            className="inline h-[18px] w-[18px] text-cn-rule-strong"
                          />
                          <span className="sr-only">Not included</span>
                        </>
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                {LICENCE_LEVELS.map((level) => (
                  <td
                    key={level.id}
                    className={`px-6 py-6 text-center ${
                      level.popular ? "bg-cn-paper-3" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onEstimate?.(level.id)}
                      className="inline-flex h-11 items-center justify-center rounded-cn-sm border border-cn-rule-strong bg-white px-4 text-cn-sm font-semibold whitespace-nowrap text-cn-ink shadow-cn-1 transition-colors duration-150 hover:border-cn-ink"
                    >
                      Estimate {level.name}
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
