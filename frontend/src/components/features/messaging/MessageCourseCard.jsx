"use client";

import { BookOpen } from "lucide-react";

export default function MessageCourseCard({ course }) {
  if (!course) return null;

  const progress = Math.round(course.progress_percentage ?? 0);

  return (
    <div className="w-56 rounded-xl overflow-hidden border border-black/10 bg-white text-stone-800 shadow-sm">
      <div className="h-24 bg-stone-100 relative overflow-hidden">
        {course.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.image}
            alt={course.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950">
            <BookOpen className="w-7 h-7 text-amber-500/70" />
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <p className="text-sm font-serif font-bold leading-snug line-clamp-2">{course.title}</p>
        <div>
          <div className="flex justify-between text-[10px] font-mono text-stone-400 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${progress >= 80 ? "bg-emerald-500" : "bg-amber-600"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
