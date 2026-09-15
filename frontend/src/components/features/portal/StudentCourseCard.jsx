"use client";

import { Calendar, CheckCircle, ChevronRight, Flame, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDate } from "@/lib/adminFormatters";

function getInitials(title) {
  return (title || "C")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function StudentCourseCard({ enrollment, onClick }) {
  const course = enrollment.course || {};
  const progress = Math.round(enrollment.completion_percentage || 0);
  // The teacher assigned to *this* enrollment, not just any instructor on the
  // course — a multi-instructor course can have different students assigned
  // to different teachers, so `course.instructors` isn't the right source.
  const assignedInstructor = enrollment.teacher?.name || "Instructor TBD";
  const isCompleted = Boolean(enrollment.is_completed);
  const statusLabel = enrollment.status || "ACTIVE";

  const progressText = isCompleted
    ? "You've completed this course — nice work finishing the full learning path from start to end."
    : progress === 0
      ? "Ready to begin. Start your first lesson to begin tracking progress on this course."
      : `You're ${progress}% of the way through this course. Keep going — steady progress each session compounds fast.`;

  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className="border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 bg-paper border-line/80"
    >
      <div>
        <div className="flex items-center justify-between gap-2 border-b pb-3 mb-4 border-line">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-md shrink-0 text-gold bg-gold/12">
              {course.code || getInitials(course.title)}
            </span>
            <span className="text-[11px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border truncate bg-porcelain text-muted border-line">
              {course.category?.name || "General"}
            </span>
          </div>

          <div className="relative flex items-center gap-1.5 min-h-6.5 shrink-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={isCompleted ? "COMPLETED" : statusLabel}
                initial={{ opacity: 0, scale: 0.9, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 4 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {isCompleted || statusLabel === "COMPLETED" ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono font-bold border px-2.5 py-1 rounded-full shadow-2xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    COMPLETED
                  </span>
                ) : statusLabel === "ACTIVE" ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono font-bold border px-2.5 py-1 rounded-full animate-pulse bg-gold/12 text-gold border-gold/25">
                    <Flame className="w-3 h-3 text-gold shrink-0 animate-bounce" />
                    ACTIVE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-mono font-medium border px-2.5 py-1 rounded-full bg-porcelain text-muted border-line/60">
                    <Lock className="w-3 h-3 text-muted shrink-0" />
                    {statusLabel}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <h3 className="text-lg font-serif font-semibold tracking-tight mb-2 transition-colors duration-250 line-clamp-2 text-ink group-hover:text-pine">
          {course.title}
        </h3>
        <p className="text-sm font-mono text-muted mb-3 tracking-tight truncate">
          Instructor: {assignedInstructor}
        </p>
        <p className="text-[13px] leading-relaxed line-clamp-3 font-light mb-4 text-muted">
          {progressText}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t gap-3 border-line">
        <span className="flex items-center gap-1.5 text-xs font-mono min-w-0 text-muted">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">Enrolled {formatDate(enrollment.enrolled_at)}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all text-pine">
          View Course Details
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
}
