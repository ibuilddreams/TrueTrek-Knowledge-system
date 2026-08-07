"use client";

import { Calendar, CheckCircle2, UserRound } from "lucide-react";
import { motion } from "motion/react";
import { formatDate } from "@/lib/adminFormatters";
import { useTheme } from "@/hooks/useTheme";

function getInitials(title) {
  return (title || "C")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProgressRing({ value, isVault }) {
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
          stroke={isVault ? "rgba(255,255,255,0.1)" : "#f5f5f4"}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={value >= 80 ? (isVault ? "#34d399" : "#059669") : isVault ? "#f59e0b" : "#d97706"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-[11px] font-mono font-bold ${
          isVault ? "text-stone-100" : "text-stone-800"
        }`}
      >
        {value}%
      </span>
    </div>
  );
}

export default function StudentCourseCard({ enrollment, onClick }) {
  const { isVault } = useTheme();
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
      className={`group relative flex flex-col h-full rounded-2xl border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-0.5 ${
        isVault
          ? "border-stone-800 bg-[#161412] hover:border-amber-700/50 hover:shadow-[0_12px_32px_-20px_rgba(0,0,0,0.6)]"
          : "border-stone-200/80 bg-white/90 hover:border-amber-200/70 hover:shadow-[0_12px_32px_-20px_rgba(120,53,15,0.28)]"
      } ${
        onClick
          ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2"
          : ""
      }`}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 ${
              isVault
                ? "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                : "border border-stone-100 bg-stone-50 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            }`}
          >

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
            <p
              className={`text-[10px] font-mono uppercase tracking-[0.16em] truncate ${
                isVault ? "text-stone-500" : "text-stone-400"
              }`}
            >
              {course.category?.name || "General"}
            </p>
            <h3
              className={`font-serif font-bold text-[1.05rem] leading-snug mt-0.5 line-clamp-2 ${
                isVault ? "text-stone-50" : "text-stone-900"
              }`}
            >
              {course.title}
            </h3>
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded-lg border ${
            statusLabel === "ACTIVE"
              ? isVault
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-emerald-50/80 text-emerald-700 border-emerald-100"
              : statusLabel === "COMPLETED"
                ? isVault
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  : "bg-sky-50/80 text-sky-700 border-sky-100"
                : isVault
                  ? "bg-stone-500/10 text-stone-400 border-stone-500/20"
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
        <ProgressRing value={progress} isVault={isVault} />
        <div className="min-w-0 flex-1">
          <p
            className={`text-[10px] font-mono uppercase tracking-[0.14em] mb-1 ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            Learning progress
          </p>
          <p
            className={`text-sm font-medium leading-snug ${
              isVault ? "text-stone-300" : "text-stone-700"
            }`}
          >
            {isCompleted
              ? "Course completed"
              : progress === 0
                ? "Ready to begin"
                : "Keep going — you're making progress"}
          </p>
          <p
            className={`text-[11px] mt-1 font-mono truncate ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            {course.code || "No code"}
          </p>
        </div>
      </div>

      <div
        className={`mt-auto space-y-3 pt-4 border-t ${
          isVault ? "border-stone-800" : "border-stone-100"
        }`}
      >
        <div
          className={`flex items-center gap-2 text-[12px] min-w-0 ${
            isVault ? "text-stone-300" : "text-stone-600"
          }`}
        >
          <UserRound
            className={`w-3.5 h-3.5 shrink-0 ${isVault ? "text-stone-500" : "text-stone-400"}`}
          />
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
            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
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
