"use client";

import { Calendar, CheckCircle2, UserRound } from "lucide-react";
import { motion } from "motion/react";
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

function ProgressRing({ value }) {
  const size = 52;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-[52px] h-[52px] shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f5f5f4"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value >= 80 ? "#059669" : "#d97706"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-mono font-bold text-stone-800">
        {value}%
      </span>
    </div>
  );
}

export default function StudentCourseCard({ enrollment }) {
  const course = enrollment.course || {};
  const progress = Math.round(enrollment.completion_percentage || 0);
  const instructors = course.instructors || [];
  const leadInstructor =
    instructors.find((item) => item.is_lead)?.name ||
    instructors[0]?.name ||
    "Instructor TBD";
  const isCompleted = Boolean(enrollment.is_completed);
  const statusLabel = enrollment.status || "ACTIVE";

  return (
    <article className="group relative flex flex-col h-full rounded-2xl border border-stone-200/80 bg-white/90 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200/70 hover:shadow-[0_12px_32px_-20px_rgba(120,53,15,0.28)]">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-stone-100 bg-stone-50 text-amber-700 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            {course.image ? (
              <img
                src={course.image}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-sm font-serif font-bold tracking-wide">
                {getInitials(course.title)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-stone-400 truncate">
              {course.category?.name || "General"}
            </p>
            <h3 className="font-serif font-bold text-[1.05rem] text-stone-900 leading-snug mt-0.5 line-clamp-2">
              {course.title}
            </h3>
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-lg border ${
            statusLabel === "ACTIVE"
              ? "bg-emerald-50/80 text-emerald-700 border-emerald-100"
              : statusLabel === "COMPLETED"
                ? "bg-sky-50/80 text-sky-700 border-sky-100"
                : "bg-stone-50 text-stone-500 border-stone-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              statusLabel === "ACTIVE"
                ? "bg-emerald-500"
                : statusLabel === "COMPLETED"
                  ? "bg-sky-500"
                  : "bg-stone-400"
            }`}
          />
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-5">
        <ProgressRing value={progress} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400 mb-1">
            Learning progress
          </p>
          <p className="text-sm text-stone-700 font-medium leading-snug">
            {isCompleted
              ? "Course completed"
              : progress === 0
                ? "Ready to begin"
                : "Keep going — you're making progress"}
          </p>
          <p className="text-[11px] text-stone-400 mt-1 font-mono truncate">
            {course.code || "No code"}
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-4 border-t border-stone-100">
        <div className="flex items-center gap-2 text-[12px] text-stone-600 min-w-0">
          <UserRound className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="truncate">{leadInstructor}</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-[11px] text-stone-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span className="truncate">
              Enrolled {formatDate(enrollment.enrolled_at)}
            </span>
          </div>
          <div
            className={`inline-flex items-center gap-1 shrink-0 font-medium ${
              isCompleted ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : null}
            <span>{isCompleted ? "Completed" : "In progress"}</span>
          </div>
        </div>

        {(course.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {course.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="text-[10px] text-stone-500 px-2 py-0.5 rounded-md bg-stone-50 border border-stone-100"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
