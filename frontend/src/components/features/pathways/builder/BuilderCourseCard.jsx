"use client";

import { BookOpen, Check, Plus } from "lucide-react";
import { formatCoursePrice } from "@/lib/store";

// A course tile in the pathway builder's picker. The whole card is the toggle
// — there's nothing else to do with it here, so there's no stretched link or
// nested action to work around.
export default function BuilderCourseCard({
  course,
  isSelected = false,
  isDisabled = false,
  onToggle,
}) {
  return (
    <button
      id={`builder-course-${course.id}`}
      type="button"
      onClick={() => onToggle(course)}
      disabled={isDisabled && !isSelected}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Remove" : "Add"} ${course.title} ${
        isSelected ? "from" : "to"
      } your pathway`}
      className={`group flex flex-col overflow-hidden rounded-cn-lg border bg-white text-left transition-[transform,box-shadow,border-color] duration-200 ease-cn-out focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent disabled:cursor-not-allowed disabled:opacity-50 ${
        isSelected
          ? "border-cn-accent ring-1 ring-cn-accent-soft"
          : "border-cn-rule hover:-translate-y-px hover:border-cn-rule-strong hover:shadow-cn-2"
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-cn-paper-2">
        {course.image ? (
          <img
            src={course.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-135 from-cn-paper-3 via-cn-paper-4 to-cn-accent-soft">
            <BookOpen className="h-8 w-8 text-cn-accent" />
          </div>
        )}

        <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-cn-ink/80 px-2.5 py-[3px] text-cn-xs font-semibold text-white">
          {course.category?.name || "General"}
        </span>

        {isSelected && (
          <span className="pointer-events-none absolute top-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-full bg-cn-accent text-white">
            <Check className="w-4 h-4" />
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2">
        <h3 className="line-clamp-2 min-h-[2.6rem] text-cn-base leading-[1.3] font-bold tracking-[-0.015em] text-cn-ink transition-colors group-hover:text-cn-accent">
          {course.title}
        </h3>

        <div className="flex items-center gap-2 text-[13px] text-cn-muted">
          <span className="capitalize">
            {(course.difficulty || "beginner").toLowerCase()}
          </span>
          {course.grade_label && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{course.grade_label}</span>
            </>
          )}
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between gap-3">
          <span className="text-cn-lg font-extrabold tracking-[-0.03em] tabular-nums text-cn-ink">
            {formatCoursePrice(course.amount)}
          </span>
          <span
            aria-hidden="true"
            className={`inline-flex h-10 items-center gap-1.5 rounded-cn-sm px-4 text-sm font-semibold transition-colors duration-150 ${
              isSelected
                ? "bg-cn-paper-3 text-cn-accent-3"
                : "bg-cn-accent text-white group-hover:bg-cn-accent-2"
            }`}
          >
            {isSelected ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                Add
              </>
            )}
          </span>
        </div>
      </div>
    </button>
  );
}
