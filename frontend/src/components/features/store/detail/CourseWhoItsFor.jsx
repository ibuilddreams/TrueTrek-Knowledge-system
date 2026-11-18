import { ShieldCheck, Target, UserRound } from "lucide-react";
import { formatGradeLabel } from "@/lib/courseOutline";
import { levelLabel } from "@/lib/courseLevel";

// The design's `.cdreq`: three plain facts about who the course is written
// for, drawn from the grade stage, the level and the catalog it sits in.
//
// "no experience needed" is appended only for a beginner course, which is what
// the design does — its intermediate and advanced pages read "<b>Advanced</b>
// level" and stop there, because telling somebody no experience is needed for
// an advanced course would be wrong.
export default function CourseWhoItsFor({ course }) {
  const grade = formatGradeLabel(course.grade_label);
  const level = levelLabel(course.difficulty);
  const category = course.category?.name;

  const rows = [
    grade && {
      key: "grade",
      icon: UserRound,
      content: (
        <>
          Learners at the <b>{grade}</b> stage
        </>
      ),
    },
    level && {
      key: "level",
      icon: Target,
      content: (
        <>
          <b>{level}</b> level
          {course.difficulty === "BEGINNER" ? ", no experience needed" : ""}
        </>
      ),
    },
    category && {
      key: "category",
      icon: ShieldCheck,
      content: (
        <>
          Part of the <b>{category}</b> catalog
        </>
      ),
    },
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="course-audience-heading" className="grid gap-4">
      <h2
        id="course-audience-heading"
        className="max-w-[20ch] text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.02em] text-balance text-cn-ink"
      >
        Who it&apos;s for
      </h2>
      <ul className="m-0 grid list-none gap-3 p-0">
        {rows.map(({ key, icon: Icon, content }) => (
          <li key={key} className="flex items-center gap-3 text-cn-ink-2">
            <Icon
              aria-hidden="true"
              className="h-[18px] w-[18px] flex-none text-cn-accent"
              strokeWidth={1.9}
            />
            <span>{content}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
