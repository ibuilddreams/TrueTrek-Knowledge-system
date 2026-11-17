"use client";

import CobaltSectionHead from "@/components/features/home/CobaltSectionHead";

const STEPS = [
  {
    title: "Licensing briefing",
    body: "We walk your leadership through the curriculum, the portal and pricing for your student body.",
  },
  {
    title: "Configure your school",
    body: "Choose a licensing level, set your colors and insignia, and add counselors and teachers.",
  },
  {
    title: "Enroll your cohort",
    body: "Bulk-enroll students from a spreadsheet. Each gets a welcome email and their pathway.",
  },
  {
    title: "Review every term",
    body: "Counselors get progress, engagement and compliance reports for every student.",
  },
];

// "From briefing to first cohort." The design draws a rule behind the four
// numbered markers; it is hidden once the steps wrap, where a line between
// rows would join steps that do not follow each other.
export default function SchoolsTimeline() {
  return (
    <section id="schools-timeline" className="cn-section">
      <div className="cn-container">
        <CobaltSectionHead
          headingId="schools-timeline-heading"
          heading="From briefing to first cohort."
          lead="A clear path from the first conversation to students in the portal."
        />

        <ol className="relative m-0 grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
          <span
            aria-hidden="true"
            className="absolute top-6 right-6 left-6 hidden h-0.5 bg-cn-rule-strong lg:block"
          />
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              data-cn-reveal
              style={{ "--cn-d": index }}
              className="cn-reveal relative grid content-start gap-3"
            >
              {/* The ring is paper, not a border, so the rule behind the
                  markers is masked rather than crossing them. */}
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-cn-accent font-extrabold text-white shadow-[0_0_0_6px_var(--color-cn-paper),0_6px_16px_-6px_rgba(36,80,230,0.6)]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-cn-lg leading-[1.2] font-bold tracking-[-0.015em] text-cn-ink">
                {step.title}
              </h3>
              <p className="text-cn-sm text-cn-ink-2">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
