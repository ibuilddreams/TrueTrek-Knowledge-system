"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  Hash,
  Users,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatDuration } from "@/components/features/curriculum/CourseCatalogParts";
import { parseCourseDescription } from "@/lib/courseDescription";
import { formatGradeLabel, pluralize } from "@/lib/courseOutline";

const DIFFICULTY_LABELS = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };

function formatUpdated(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// The ink band at the top of the course page: breadcrumb, title, summary,
// badges, instructors and key facts — the design's `.cdh`. The full-bleed
// background is a pseudo element so the purchase card (a sibling in the page
// grid) can sit over it.
//
// It deliberately does *not* carry `.cn-dark-grid`: that class paints the
// engraved grid on `::before`, which is the same pseudo-element the full-bleed
// ink is drawn with here. The two overwrite each other and the band vanishes.
export default function CourseDetailHero({ course, moduleCount = 0 }) {
  const duration = formatDuration(course.duration_minutes);
  const updated = formatUpdated(course.updated_at);
  const instructors = (course.instructors || []).filter((instructor) => instructor.name);
  const purchaseCount = course.purchase_count || 0;
  const { summary } = parseCourseDescription(course.description);
  const grade = formatGradeLabel(course.grade_label);

  return (
    <header className="relative isolate pb-14 text-white before:absolute before:inset-y-0 before:-right-[100vw] before:-left-[100vw] before:-z-10 before:bg-cn-ink">
      <nav aria-label="Breadcrumb" className="relative flex flex-wrap items-center gap-1.5 text-cn-sm font-semibold text-cn-accent-soft">
        <Link href={ROUTES.STORE} className="hover:underline">
          Store
        </Link>
        {course.category?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-white/50" aria-hidden="true" />
            <Link href={`${ROUTES.STORE}?category=${course.category.id}`} className="hover:underline">
              {course.category.name}
            </Link>
          </>
        )}
      </nav>

      <h1 className="relative mt-4 max-w-[20ch] text-[clamp(2rem,2.4vw_+_1rem,3.25rem)] leading-[1.08] font-extrabold tracking-[-0.03em] text-balance text-white">
        {course.title}
      </h1>

      {summary && (
        <p className="relative mt-5 line-clamp-3 max-w-[52ch] text-cn-lg leading-[1.55] whitespace-pre-line text-cn-on-ink-2">
          {summary}
        </p>
      )}

      <div className="relative mt-6 flex flex-wrap items-center gap-2">
        {DIFFICULTY_LABELS[course.difficulty] && (
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-[6px]">
            {DIFFICULTY_LABELS[course.difficulty]}
          </span>
        )}
        {grade && (
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-cn-accent-3">
            {grade}
          </span>
        )}
        {/* The design's `.cdmeta` also carries the course code and how many
            modules it holds — the two facts a buyer scans for. */}
        {course.code && (
          <span className="ml-1 inline-flex items-center gap-2 text-cn-sm text-cn-on-ink-2">
            <Hash className="w-3.5 h-3.5" />
            {course.code}
          </span>
        )}
        {moduleCount > 0 && (
          <span className="inline-flex items-center gap-2 text-cn-sm text-cn-on-ink-2">
            <BookOpen className="w-3.5 h-3.5" />
            {pluralize(moduleCount, "module")}
          </span>
        )}
        {purchaseCount > 0 && (
          <span className="inline-flex items-center gap-2 text-cn-sm text-cn-on-ink-2">
            <Users className="w-3.5 h-3.5" />
            {pluralize(purchaseCount, "student")}
          </span>
        )}
      </div>

      {instructors.length > 0 && (
        <p className="relative mt-5 text-sm text-cn-on-ink-2">
          Created by{" "}
          {instructors.map((instructor, index) => (
            <span key={instructor.id}>
              {index > 0 && ", "}
              <Link
                href={`${ROUTES.INSTRUCTORS}/${instructor.user_id}`}
                className="font-semibold text-cn-accent-soft underline decoration-cn-accent-soft/40 underline-offset-2 hover:decoration-cn-accent-soft"
              >
                {instructor.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="relative mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-cn-on-ink-2">
        {updated && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Last updated {updated}
          </span>
        )}
        {duration && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {duration}
          </span>
        )}
      </div>
    </header>
  );
}
