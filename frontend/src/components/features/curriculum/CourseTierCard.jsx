"use client";

import { CheckCircle, ChevronRight, Flame, Lock } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { formatDurationMinutes, getInitials } from "@/lib/curriculum";

const STATUS_META = {
  COMPLETED: {
    label: "COMPLETED",
    icon: CheckCircle,
    className: (isVault) =>
      isVault
        ? "bg-emerald-900/30 text-emerald-300 border-emerald-700/40"
        : "bg-emerald-50 text-emerald-700 border-emerald-200",
    iconClassName: "text-emerald-600",
    pulse: false,
  },
  IN_PROGRESS: {
    label: "IN PROGRESS",
    icon: Flame,
    className: (isVault) =>
      isVault
        ? "bg-amber-900/30 text-amber-300 border-amber-700/40"
        : "bg-amber-50 text-amber-700 border-amber-200",
    iconClassName: "text-amber-600 animate-bounce",
    pulse: true,
  },
  LOCKED: {
    label: "NOT ENROLLED",
    icon: Lock,
    className: (isVault) =>
      isVault
        ? "bg-stone-800/60 text-stone-500 border-stone-700/50"
        : "bg-stone-100 text-stone-400 border-stone-200/60",
    iconClassName: "text-stone-400",
    pulse: false,
  },
};

export default function CourseTierCard({ course, enrollmentStatus, onClick }) {
  const { isVault } = useTheme();
  const statusMeta = enrollmentStatus ? STATUS_META[enrollmentStatus] : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className={`border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:ring-offset-2 ${
        isVault ? "bg-[#161412] border-stone-800" : "bg-white border-stone-200/80"
      }`}
    >
      <div>
        <div
          className={`flex items-center justify-between gap-2 border-b pb-3 mb-4 ${
            isVault ? "border-stone-800" : "border-stone-100"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md shrink-0 ${
                isVault ? "text-amber-500 bg-amber-600/15" : "text-amber-750 bg-amber-50"
              }`}
            >
              {course.code || getInitials(course.title)}
            </span>
            <span
              className={`text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border truncate ${
                isVault
                  ? "bg-stone-900 text-stone-300 border-stone-700"
                  : "bg-stone-50 text-stone-700 border-stone-200"
              }`}
            >
              {course.category?.name || "General"}
            </span>
          </div>

          {statusMeta && (
            <span
              className={`flex items-center gap-1 text-[10px] font-mono font-bold border px-2.5 py-1 rounded-full shrink-0 ${
                statusMeta.pulse ? "animate-pulse" : ""
              } ${statusMeta.className(isVault)}`}
            >
              <statusMeta.icon className={`w-3 h-3 shrink-0 ${statusMeta.iconClassName}`} />
              {statusMeta.label}
            </span>
          )}
        </div>

        <h3
          className={`text-lg font-serif font-semibold tracking-tight mb-2 transition-colors duration-250 line-clamp-2 ${
            isVault
              ? "text-stone-100 group-hover:text-amber-500"
              : "text-stone-900 group-hover:text-amber-800"
          }`}
        >
          {course.title}
        </h3>
        <p className="text-xs font-mono text-stone-400 mb-3 tracking-tight">
          Focus: {course.category?.name || "General"}
        </p>
        <p
          className={`text-[13px] leading-relaxed line-clamp-3 font-light mb-4 ${
            isVault ? "text-stone-400" : "text-stone-600"
          }`}
        >
          {course.description || "No description has been added for this course yet."}
        </p>
      </div>

      <div
        className={`flex items-center justify-between pt-4 border-t ${
          isVault ? "border-stone-800" : "border-stone-100"
        }`}
      >
        <span className="text-stone-400 text-[11px] font-mono">
          {formatDurationMinutes(course.duration_minutes)}
        </span>
        <span
          className={`text-xs font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all ${
            isVault ? "text-amber-500" : "text-amber-700"
          }`}
        >
          View Course Details
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
}
