import { Check } from "lucide-react";
import CourseSectionHeading from "./CourseSectionHeading";

// "What you'll learn" — hidden entirely when the course has no points yet.
export default function CourseLearningOutcomes({ outcomes }) {
  if (!outcomes?.length) return null;

  return (
    <section aria-labelledby="course-outcomes-heading">
      <CourseSectionHeading id="course-outcomes-heading">What you'll learn</CourseSectionHeading>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-card border border-line bg-paper p-6 shadow-soft">
        {outcomes.map((outcome, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-ink/90 leading-relaxed">
            <span
              aria-hidden="true"
              className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-sage/70 text-moss flex items-center justify-center"
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
