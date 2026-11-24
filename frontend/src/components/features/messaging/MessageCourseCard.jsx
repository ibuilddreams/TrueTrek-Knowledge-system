"use client";

import { BookOpen } from "lucide-react";

export default function MessageCourseCard({ course }) {
  if (!course) return null;

  const progress = Math.round(course.progress_percentage ?? 0);

  return (
    <div className="w-56 rounded-xl overflow-hidden border border-black/10 bg-white text-cn-p-ink shadow-sm">
      <div className="h-24 bg-cn-p-neutral-bg relative overflow-hidden">
        {course.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cn-p-accent to-cn-p-accent-hover">
            <BookOpen className="w-7 h-7 text-cn-p-accent-soft" />
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <p className="text-sm font-bold leading-snug line-clamp-2">{course.title}</p>
        <div>
          <div className="flex justify-between text-[10px] text-cn-p-muted mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-cn-p-neutral-bg h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${progress >= 80 ? "bg-cn-p-ok" : "bg-cn-p-accent"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
