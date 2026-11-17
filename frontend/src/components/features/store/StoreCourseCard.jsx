"use client";

import Link from "next/link";
import { BookOpen, GraduationCap, Hash } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";

// The design's level pill. Three fixed colours, keyed off the API's own
// uppercase difficulty values; anything unrecognised falls back to the neutral
// paper chip rather than rendering an unstyled badge.
const LEVEL_TONES = {
  BEGINNER: "bg-cn-ok-bg text-cn-ok",
  INTERMEDIATE: "bg-cn-paper-3 text-cn-accent-3",
  ADVANCED: "bg-cn-warn-bg text-cn-warn",
};

function levelLabel(difficulty) {
  if (!difficulty) return null;
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

export default function StoreCourseCard({
  course,
  onRequestEnroll,
  revealDelay = 0,
}) {
  const href = `${ROUTES.STORE}/${course.slug}`;
  const level = levelLabel(course.difficulty);

  return (
    <article
      id={`store-course-card-${course.id}`}
      data-cn-reveal
      style={{ "--cn-d": revealDelay }}
      className="cn-reveal group grid grid-cols-1 overflow-hidden rounded-cn-lg border border-cn-rule bg-white transition-[transform,box-shadow,border-color] duration-200 ease-cn-out hover:-translate-y-1 hover:border-transparent hover:shadow-cn-3 sm:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      <div className="relative sm:h-full">
        <Link
          href={href}
          aria-label={`View details for ${course.title}`}
          className="block focus:outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cn-accent sm:h-full"
        >
          <figure className="m-0 aspect-16/9 overflow-hidden bg-cn-paper-2 sm:aspect-auto sm:h-full">
            {course.image ? (
              <img
                src={course.image}
                alt={course.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-cn-out group-hover:scale-[1.05]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-linear-135 from-cn-paper-3 via-cn-paper-4 to-cn-accent-soft">
                <BookOpen
                  className="h-10 w-10 text-cn-accent"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </figure>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-cn-sm font-semibold whitespace-nowrap text-cn-accent">
            {course.category?.name || "General"}
          </span>
          {level && (
            <span
              className={`rounded-full px-2.5 py-[3px] text-cn-xs font-semibold whitespace-nowrap ${
                LEVEL_TONES[course.difficulty] || "bg-cn-paper-2 text-cn-ink-2"
              }`}
            >
              {level}
            </span>
          )}
        </div>

        <h3 className="text-cn-base leading-[1.3] font-bold tracking-[-0.015em] text-cn-ink">
          <Link
            href={href}
            className="line-clamp-2 no-underline transition-colors duration-150 hover:text-cn-accent"
          >
            {course.title}
          </Link>
        </h3>

        <p className="line-clamp-2 text-cn-sm leading-[1.55] text-cn-ink-2">
          {course.description ||
            "No description has been added for this course yet."}
        </p>

        <ul className="m-0 mt-2 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-[13px] leading-[1.55] text-cn-muted">
          {course.grade_label && (
            <li className="flex items-center gap-1.5">
              <GraduationCap className="h-[15px] w-[15px] flex-none text-cn-accent-2" />
              {course.grade_label}
            </li>
          )}
          {course.code && (
            <li className="flex items-center gap-1.5">
              <Hash className="h-[15px] w-[15px] flex-none text-cn-accent-2" />
              {course.code}
            </li>
          )}
        </ul>

        {/* `mt-auto` keeps every card's footer on the same baseline however
            long the title and description above it run. */}
        <div className="mt-auto grid gap-3 border-t border-cn-rule pt-3">
          <div className="flex items-baseline gap-1.5">
            <b className="text-cn-xl leading-[1.55] font-extrabold tracking-[-0.03em] tabular-nums text-cn-ink">
              {formatCoursePrice(course.amount)}
            </b>
            <small className="text-cn-sm text-cn-muted">one-time</small>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={href}
              className="inline-flex h-11 items-center justify-center rounded-cn-sm border border-cn-rule-strong bg-white px-2.5 text-cn-sm font-semibold whitespace-nowrap text-cn-ink no-underline shadow-cn-1 transition-colors duration-150 ease-cn-out hover:border-cn-ink"
            >
              View details
            </Link>

            {/* One action, as the design has it. A visitor who is not signed
                in is asked to sign in first; a student goes to the portal,
                where the purchase actually happens. */}
            <button
              id={`enroll-${course.id}`}
              type="button"
              onClick={() => onRequestEnroll?.(course)}
              className="inline-flex h-11 items-center justify-center rounded-cn-sm bg-cn-accent px-2.5 text-cn-sm font-semibold whitespace-nowrap text-white transition-[background-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:bg-cn-accent-2"
            >
              Enroll now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
