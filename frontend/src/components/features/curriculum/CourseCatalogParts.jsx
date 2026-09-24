import { BookOpen, Clock } from "lucide-react";
import { formatCoursePrice } from "@/lib/store";

const DIFFICULTY_LABELS = { BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" };

export function formatDuration(minutes) {
  const value = Number(minutes);
  if (!value) return null;
  const hours = Math.round((value / 60) * 10) / 10;
  return hours >= 1 ? `${hours} hr${hours === 1 ? "" : "s"}` : `${value} min`;
}

export function CourseBanner({ course }) {
  return (
    <div className="relative h-44 overflow-hidden bg-gradient-to-br from-pine to-ink">
      {course.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.image} alt={course.title} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen className="h-10 w-10 text-gold/70" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
      <span className="absolute left-3 top-3 rounded-md border border-ink/60 bg-ink/80 px-2.5 py-1 text-[10px] font-sans font-medium uppercase tracking-widest text-gold backdrop-blur-xs">
        {course.category?.name || "General"}
      </span>
      {DIFFICULTY_LABELS[course.difficulty] && (
        <span className="absolute bottom-3 right-3 rounded-md bg-paper/90 px-2.5 py-1 text-[10px] font-sans font-medium text-ink shadow-xs">
          {DIFFICULTY_LABELS[course.difficulty]}
        </span>
      )}
    </div>
  );
}

export function CourseBadges({ course }) {
  const duration = formatDuration(course.duration_minutes);
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
      {duration && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {duration}
        </span>
      )}
      <span className="ml-auto text-sm font-semibold text-pine">{formatCoursePrice(course.amount)}</span>
    </div>
  );
}
