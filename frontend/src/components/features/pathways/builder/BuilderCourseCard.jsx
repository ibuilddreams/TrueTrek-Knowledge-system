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
      className={`group text-left flex flex-col overflow-hidden rounded-card border bg-paper shadow-soft transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
        isSelected
          ? "border-gold ring-1 ring-gold/40"
          : "border-line hover:border-pine/30 hover:shadow-elevated"
      }`}
    >
      <div className="relative aspect-video overflow-hidden bg-porcelain">
        {course.image ? (
          <img
            src={course.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pine to-ink">
            <BookOpen className="w-8 h-8 text-gold/70" />
          </div>
        )}

        <span className="pointer-events-none absolute top-3 left-3 text-[10px] font-sans tracking-widest font-medium uppercase bg-ink/80 text-gold px-2 py-0.5 rounded-md">
          {course.category?.name || "General"}
        </span>

        {isSelected && (
          <span className="pointer-events-none absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-gold text-ink flex items-center justify-center shadow-md">
            <Check className="w-4 h-4" />
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4 gap-2">
        <h3 className="text-[15px] font-serif tracking-tight text-ink line-clamp-2 min-h-[2.6rem] leading-snug group-hover:text-pine transition-colors">
          {course.title}
        </h3>

        <div className="flex items-center gap-2 text-[11px] text-muted font-sans">
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
          <span className="text-lg font-sans font-semibold text-ink">
            {formatCoursePrice(course.amount)}
          </span>
          <span
            aria-hidden="true"
            className={`font-sans text-[11px] uppercase font-medium px-4 py-2.5 rounded-full tracking-widest transition-all duration-200 flex items-center gap-1.5 ${
              isSelected
                ? "bg-gold/20 text-[#8a6f2e]"
                : "bg-pine text-paper group-hover:bg-moss"
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
