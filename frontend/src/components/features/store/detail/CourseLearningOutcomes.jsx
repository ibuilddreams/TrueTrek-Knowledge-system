import { Check } from "lucide-react";
import CourseSectionHeading from "./CourseSectionHeading";

// "What you'll learn" — hidden entirely when the course has no points yet.
export default function CourseLearningOutcomes({ outcomes }) {
  if (!outcomes?.length) return null;

  return (
    <section aria-labelledby="course-outcomes-heading">
      <CourseSectionHeading tone="cobalt" id="course-outcomes-heading">What you'll learn</CourseSectionHeading>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-cn border border-cn-rule bg-white p-6 shadow-cn-1">
        {outcomes.map((outcome, index) => (
          <li key={index} className="flex items-start gap-3 text-cn-base leading-[1.55] text-cn-ink-2">
            <span
              aria-hidden="true"
              className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-cn-paper-3 text-cn-accent-2 flex items-center justify-center"
            >
              <Check className="w-3 h-3" strokeWidth={3} />
            </span>
            <span>{outcome}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
