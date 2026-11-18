"use client";

import Link from "next/link";
import { BookOpen, Tag, UserRound } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { parseCourseDescription } from "@/lib/courseDescription";
import { formatGradeLabel, pluralize } from "@/lib/courseOutline";
import { levelLabel, LEVEL_TONES } from "@/lib/courseLevel";

// The design's `.cdhl`: the left column of the ink band at the top of a course
// page — breadcrumb, title, lead and one row of facts.
//
// The band itself (`.cdh`) and the empty 4fr column beside this are owned by
// the page, because the sticky buy card is pulled up out of the body grid to
// fill that column.
//
// The design's meta row carries exactly four things: the level pill, the grade
// stage, the course code and the module count. Anything else the API knows —
// instructors, last updated, how many have bought it — the design does not show
// here, so neither do we.
export default function CourseDetailHero({ course, moduleCount = 0 }) {
  const { summary } = parseCourseDescription(course.description);
  const grade = formatGradeLabel(course.grade_label);
  const level = levelLabel(course.difficulty);

  return (
    <div className="grid min-w-0 gap-4">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-2 text-cn-sm font-semibold text-cn-on-ink-2"
      >
        <Link
          href={ROUTES.STORE}
          className="text-cn-accent-soft no-underline hover:underline"
        >
          Store
        </Link>
        {course.category?.name && (
          <>
            <span aria-hidden="true">/</span>
            <span>{course.category.name}</span>
          </>
        )}
      </nav>

      <h1 className="text-[clamp(2rem,2.4vw_+_1rem,3.25rem)] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance text-cn-on-ink">
        {course.title}
      </h1>

      {summary && (
        <p className="max-w-[52ch] text-cn-lg leading-[1.55] whitespace-pre-line text-cn-on-ink-2">
          {summary}
        </p>
      )}

      <ul className="m-0 flex list-none flex-wrap items-center gap-x-6 gap-y-3 p-0 text-cn-sm text-cn-on-ink-2">
        {level && (
          <li>
            <span
              className={`rounded-full px-2.5 py-[3px] text-cn-xs font-semibold whitespace-nowrap ${
                LEVEL_TONES[course.difficulty] || "bg-cn-paper-2 text-cn-ink-2"
              }`}
            >
              {level}
            </span>
          </li>
        )}
        {grade && (
          <li className="flex items-center gap-1.5">
            <UserRound className="h-4 w-4 flex-none" strokeWidth={1.9} />
            {grade}
          </li>
        )}
        {course.code && (
          <li className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 flex-none" strokeWidth={1.9} />
            {course.code}
          </li>
        )}
        {moduleCount > 0 && (
          <li className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 flex-none" strokeWidth={1.9} />
            {pluralize(moduleCount, "module")}
          </li>
        )}
      </ul>
    </div>
  );
}
