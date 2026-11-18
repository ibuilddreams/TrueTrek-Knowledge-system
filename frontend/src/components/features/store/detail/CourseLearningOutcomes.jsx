import { Check } from "lucide-react";

// The design's `.cdlearn`: a bordered box of what the course teaches, two
// columns on desktop and one below 60rem. Hidden entirely when the course has
// no points yet, rather than drawing an empty frame.
export default function CourseLearningOutcomes({ outcomes }) {
  if (!outcomes?.length) return null;

  return (
    <section
      aria-labelledby="course-outcomes-heading"
      className="grid gap-4 rounded-cn-lg border border-cn-rule p-10"
    >
      <h2
        id="course-outcomes-heading"
        className="max-w-[20ch] text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-balance text-cn-ink"
      >
        What you&apos;ll learn
      </h2>
      <ul className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-3 p-0 max-[60rem]:grid-cols-1">
        {outcomes.map((outcome, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check
              aria-hidden="true"
              className="mt-[3px] h-[18px] w-[18px] flex-none text-cn-accent"
              strokeWidth={2.4}
            />
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
