import { BookOpen, ClipboardList, Clock, GraduationCap, ListChecks } from "lucide-react";
import { formatDuration } from "@/components/features/curriculum/CourseCatalogParts";
import { formatGradeLabel, pluralize } from "@/lib/courseOutline";
import CourseSectionHeading from "./CourseSectionHeading";

// "This course includes": only facts the platform actually knows.
export default function CourseIncludes({ course, totals }) {
  const duration = formatDuration(course.duration_minutes);
  const grade = formatGradeLabel(course.grade_label);
  const items = [
    totals.lessons > 0 && { icon: BookOpen, text: pluralize(totals.lessons, "lesson") },
    totals.assignments > 0 && { icon: ClipboardList, text: pluralize(totals.assignments, "assignment") },
    totals.quizzes > 0 && { icon: ListChecks, text: pluralize(totals.quizzes, "quiz", "quizzes") },
    duration && { icon: Clock, text: `${duration} of learning` },
    grade && { icon: GraduationCap, text: grade },
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="course-includes-heading">
      <CourseSectionHeading tone="cobalt" id="course-includes-heading">This course includes</CourseSectionHeading>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {items.map(({ icon: Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 rounded-xl border border-cn-rule bg-white px-4 py-3 text-sm text-cn-ink shadow-xs"
          >
            <span className="w-8 h-8 shrink-0 rounded-lg bg-cn-paper-2 text-cn-accent flex items-center justify-center">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </span>
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}
