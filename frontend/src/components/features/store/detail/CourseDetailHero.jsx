"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, Users } from "lucide-react";
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

// Dark banner at the top of the course page: breadcrumb, title, summary,
// badges, instructors and key facts. The full-bleed background is a pseudo
// element so the purchase card (a sibling in the page grid) can sit over it.
export default function CourseDetailHero({ course }) {
  const duration = formatDuration(course.duration_minutes);
  const updated = formatUpdated(course.updated_at);
  const instructors = (course.instructors || []).filter((instructor) => instructor.name);
  const purchaseCount = course.purchase_count || 0;
  const { summary } = parseCourseDescription(course.description);
  const grade = formatGradeLabel(course.grade_label);

  return (
    <header className="relative isolate py-10 text-paper before:absolute before:inset-y-0 before:-left-[100vw] before:-right-[100vw] before:-z-10 before:bg-pine">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-sans text-gold">
        <Link href={ROUTES.STORE} className="hover:underline">
          Store
        </Link>
        {course.category?.name && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-paper/50" aria-hidden="true" />
            <Link href={`${ROUTES.STORE}?category=${course.category.id}`} className="hover:underline">
              {course.category.name}
            </Link>
          </>
        )}
      </nav>

      <h1 className="mt-4 text-3xl md:text-4xl font-serif font-light tracking-tight leading-tight">
        {course.title}
      </h1>

      {summary && (
        <p className="mt-4 max-w-2xl text-sm md:text-base font-light leading-relaxed text-paper/80 line-clamp-3 whitespace-pre-line">
          {summary}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {DIFFICULTY_LABELS[course.difficulty] && (
          <span className="text-[10px] font-sans tracking-widest font-medium uppercase bg-paper/10 border border-paper/20 px-2.5 py-1 rounded-md">
            {DIFFICULTY_LABELS[course.difficulty]}
          </span>
        )}
        {grade && (
          <span className="text-[10px] font-sans tracking-widest font-medium uppercase bg-gold text-ink px-2.5 py-1 rounded-md">
            {grade}
          </span>
        )}
        {purchaseCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-sans text-paper/80">
            <Users className="w-3.5 h-3.5" />
            {pluralize(purchaseCount, "student")}
          </span>
        )}
      </div>

      {instructors.length > 0 && (
        <p className="mt-4 text-sm font-sans text-paper/80">
          Created by{" "}
          {instructors.map((instructor, index) => (
            <span key={instructor.id}>
              {index > 0 && ", "}
              <Link
                href={`${ROUTES.INSTRUCTORS}/${instructor.user_id}`}
                className="text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold"
              >
                {instructor.name}
              </Link>
            </span>
          ))}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-sans text-paper/70">
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
