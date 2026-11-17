import { BookOpen, Clock, GraduationCap } from "lucide-react";
import { formatCoursePrice } from "@/lib/store";

const DIFFICULTY_LABELS = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };

export function formatDuration(minutes) {
  const value = Number(minutes);
  if (!value) return null;
  const hours = Math.round((value / 60) * 10) / 10;
  return hours >= 1 ? `${hours} hr${hours === 1 ? "" : "s"}` : `${value} min`;
}

// The image at the head of the course page's purchase card. Only
// CourseCatalogDetail renders these two — the store's detail screens import
// `formatDuration` from here and nothing else.
export function CourseBanner({ course }) {
  return (
    <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,var(--color-cn-accent-3),var(--color-cn-ink))]">
      {course.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.image} alt={course.title} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen className="h-10 w-10 text-white/70" strokeWidth={1.5} />
        </div>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,16,40,0.55),transparent_60%)]" />
      <span className="absolute top-4 left-4 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-[6px]">
        {course.category?.name || "General"}
      </span>
      {DIFFICULTY_LABELS[course.difficulty] && (
        <span className="absolute right-4 bottom-4 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-cn-accent-3">
          {DIFFICULTY_LABELS[course.difficulty]}
        </span>
      )}
    </div>
  );
}

// The meta row under the course title. It sits on the page's ink band, so it
// is coloured for that surface rather than for paper.
export function CourseBadges({ course }) {
  const duration = formatDuration(course.duration_minutes);
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-cn-on-ink-2">
      {course.grade_label && (
        <span className="inline-flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-cn-accent-soft" />
          {course.grade_label}
        </span>
      )}
      {duration && (
        <span className="inline-flex items-center gap-2">
          <Clock className="h-4 w-4 text-cn-accent-soft" />
          {duration}
        </span>
      )}
      <span className="ml-auto text-cn-xl font-extrabold tracking-[-0.02em] text-white tabular-nums">{formatCoursePrice(course.amount)}</span>
    </div>
  );
}
