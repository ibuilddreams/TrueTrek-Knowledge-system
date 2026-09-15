"use client";

import { ArrowRight, CheckCircle2, Clock, Trophy } from "lucide-react";
import { motion } from "motion/react";

function getInitials(title) {
  return (title || "C")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function scoreTone(percentage) {
  if (percentage >= 70) return "high";
  if (percentage >= 50) return "mid";
  return "low";
}

const RING_COLOR = {
  high: { light: "#059669" },
  mid: { light: "#d97706" },
  low: { light: "#e11d48" },
  none: { light: "#d97706" },
};

const SCORE_CHIP = {
  high: {
    light: "bg-emerald-50 border-emerald-100 text-emerald-700",
  },
  mid: {
    light: "bg-gold/12 border-gold/25 text-gold",
  },
  low: {
    light: "bg-rose-50 border-rose-100 text-rose-600",
  },
  none: {
    light: "bg-porcelain border-line text-muted",
  },
};

const ACCENTS = {
  amber: {
    light: "bg-gold/12 border-gold/25 text-gold",
  },
  violet: {
    light: "bg-violet-50 border-violet-100 text-violet-700",
  },
};

function ProgressRing({ value, tone }) {
  const size = 56;
  const stroke = 4.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;
  const color = RING_COLOR[tone].light;

  return (
    <div className="relative w-14 h-14 shrink-0">
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
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-ink">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}

export default function CourseworkSummaryCard({
  courseTitle,
  accent = "amber",
  itemLabel,
  totalCount,
  pendingCount,
  completedCount,
  completedLabel,
  averagePercentage,
  onOpen,
}) {
  const completionPercentage = totalCount
    ? Math.round(((totalCount - pendingCount) / totalCount) * 100)
    : 0;
  const hasScore = averagePercentage !== null && averagePercentage !== undefined;
  const tone = hasScore ? scoreTone(averagePercentage) : "none";
  const allCaughtUp = pendingCount === 0;
  const accentClass = ACCENTS[accent] || ACCENTS.amber;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full text-left rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 p-5 space-y-4 border-line/80 bg-paper/90 hover:border-gold/40 hover:shadow-[0_12px_32px_-20px_rgba(199,168,91,0.28)]"
    >
      <div className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${accentClass.light}`}
          >
            <span className="text-sm font-serif font-bold tracking-wide">
              {getInitials(courseTitle)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
              Course
            </p>
            <h3 className="font-serif font-bold mt-0.5 truncate text-ink">
              {courseTitle}
            </h3>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
            allCaughtUp
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : "bg-gold/12 text-gold border-gold/25"
          }`}
        >
          {allCaughtUp ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {allCaughtUp ? "All caught up" : `${pendingCount} to do`}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ProgressRing value={completionPercentage} tone={tone} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted">
            {itemLabel === "quiz" ? "Attempted" : "Turned in"}
          </p>
          <p className="text-sm font-medium leading-snug mt-0.5 text-muted">
            {totalCount - pendingCount} of {totalCount} {itemLabel}
            {totalCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border bg-emerald-50 border-emerald-100 text-emerald-700"
        >
          <CheckCircle2 className="w-3 h-3" />
          {completedCount} {completedLabel}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${SCORE_CHIP[tone].light}`}
        >
          <Trophy className="w-3 h-3" />
          {hasScore ? `${averagePercentage}% avg` : "No grades yet"}
        </span>
      </div>

      <div
        className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider transition pt-1 text-muted group-hover:text-pine"
      >
        View {totalCount} {itemLabel}
        {totalCount === 1 ? "" : itemLabel === "quiz" ? "zes" : "s"}
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}
