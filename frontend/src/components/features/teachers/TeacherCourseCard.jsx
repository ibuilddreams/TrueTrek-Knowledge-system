"use client";

import { useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  HelpCircle,
  Layers,
  PlayCircle,
  Users,
} from "lucide-react";

const STATUS_DOT_STYLES = {
  PUBLISHED: "bg-emerald-500",
  DRAFT: "bg-amber-500",
  ARCHIVED: "bg-stone-400",
};

const STATUS_TEXT_STYLES = {
  PUBLISHED: "text-emerald-700",
  DRAFT: "text-amber-700",
  ARCHIVED: "text-stone-500",
};

const COURSE_STATS = [
  {
    key: "modules_count",
    label: "Modules",
    icon: Layers,
    tone: "text-amber-600",
  },
  {
    key: "lessons_count",
    label: "Lessons",
    icon: PlayCircle,
    tone: "text-sky-600",
  },
  {
    key: "total_students",
    label: "Students",
    icon: Users,
    tone: "text-emerald-600",
  },
  {
    key: "assignments_count",
    label: "Assigns",
    icon: ClipboardCheck,
    tone: "text-violet-600",
  },
  {
    key: "quizzes_count",
    label: "Quizzes",
    icon: HelpCircle,
    tone: "text-rose-600",
  },
];

export default function TeacherCourseCard({
  course,
  onViewCourse,
  onViewStudents,
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const statusDotClass =
    STATUS_DOT_STYLES[course.status] || STATUS_DOT_STYLES.ARCHIVED;
  const statusTextClass =
    STATUS_TEXT_STYLES[course.status] || STATUS_TEXT_STYLES.ARCHIVED;
  const hasThumbnail = Boolean(course.image) && !imageFailed;

  return (
    <div className="group relative w-full bg-white border border-stone-200/90 rounded-2xl shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden transition-all duration-300 hover:shadow-[0_4px_10px_rgba(28,25,23,0.06),0_16px_32px_-14px_rgba(180,83,9,0.18)] hover:border-amber-200/80">
      <div className="relative h-20 overflow-hidden">
        {hasThumbnail ? (
          <img
            src={course.image}
            alt=""
            onError={() => setImageFailed(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900">
            <Layers className="absolute -right-3 -bottom-5 w-28 h-28 text-white/10 rotate-15" />
          </div>
        )}
        <div
          className={
            hasThumbnail
              ? "absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/40"
              : "absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10"
          }
        />

        <div className="relative h-full px-5 pt-4 flex items-start justify-between gap-2">
          <span className="inline-flex items-center bg-white/95 text-amber-800 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full shadow-sm truncate max-w-[45%]">
            {course.category?.name || "Uncategorized"}
          </span>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 bg-white/95 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-full shadow-sm ${statusTextClass}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
            {course.status}
          </span>
        </div>
      </div>

      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <div className="flex items-center gap-3 mt-2 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 text-amber-700 flex items-center justify-center shrink-0 shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-base text-stone-900 leading-snug truncate">
            {course.title}
          </h3>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {COURSE_STATS.map(({ key, label, icon: Icon, tone }) => (
            <div
              key={key}
              className="flex flex-col items-center gap-1 rounded-xl border border-stone-100 bg-stone-50/80 py-2.5"
            >
              <Icon className={`w-4 h-4 ${tone}`} />
              <span className="text-sm font-serif font-bold text-stone-900">
                {course[key] ?? 0}
              </span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-stone-400">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            type="button"
            onClick={onViewCourse}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-stone-100 text-[11px] font-semibold font-mono rounded-xl tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
            title="View course details"
            aria-label="View course details"
          >
            <BookOpen className="w-3.5 h-3.5" />
            VIEW COURSE
          </button>
          <button
            type="button"
            onClick={onViewStudents}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-amber-50 border border-stone-200 hover:border-amber-200 text-stone-700 hover:text-amber-800 text-[11px] font-semibold font-mono rounded-xl tracking-wider shadow-xs transition-colors cursor-pointer"
            title="View enrolled students"
            aria-label="View enrolled students"
          >
            <Users className="w-3.5 h-3.5" />
            STUDENTS
          </button>
        </div>
      </div>
    </div>
  );
}
