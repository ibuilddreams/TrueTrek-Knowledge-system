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
  high: { light: "#059669", vault: "#34d399" },
  mid: { light: "#d97706", vault: "#f59e0b" },
  low: { light: "#e11d48", vault: "#fb7185" },
  none: { light: "#d97706", vault: "#f59e0b" },
};

const SCORE_CHIP = {
  high: {
    light: "bg-emerald-50 border-emerald-100 text-emerald-700",
    vault: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  },
  mid: {
    light: "bg-amber-50 border-amber-100 text-amber-800",
    vault: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  low: {
    light: "bg-rose-50 border-rose-100 text-rose-600",
    vault: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  },
  none: {
    light: "bg-stone-50 border-stone-100 text-stone-500",
    vault: "bg-white/5 border-stone-700 text-stone-400",
  },
};

const ACCENTS = {
  amber: {
    light: "bg-amber-50 border-amber-100 text-amber-700",
    vault: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  violet: {
    light: "bg-violet-50 border-violet-100 text-violet-700",
    vault: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  },
};

function ProgressRing({ value, tone, isVault }) {
  const size = 56;
  const stroke = 4.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const offset = circumference - (clamped / 100) * circumference;
  const color = RING_COLOR[tone][isVault ? "vault" : "light"];

  return (
    <div className="relative w-14 h-14 shrink-0">
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
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-xs font-mono font-bold ${
          isVault ? "text-stone-100" : "text-stone-800"
        }`}
      >
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
  isVault,
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
      className={`group relative w-full text-left rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 p-5 space-y-4 ${
        isVault
          ? "border-stone-800 bg-[#161412] hover:border-amber-700/50 hover:shadow-[0_12px_32px_-20px_rgba(0,0,0,0.6)]"
          : "border-stone-200/80 bg-white/90 hover:border-amber-200/70 hover:shadow-[0_12px_32px_-20px_rgba(120,53,15,0.28)]"
      }`}
    >
      <div className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
              isVault ? accentClass.vault : accentClass.light
            }`}
          >
            <span className="text-sm font-serif font-bold tracking-wide">
              {getInitials(courseTitle)}
            </span>
          </div>
          <div className="min-w-0">
            <p
              className={`text-[11px] font-mono uppercase tracking-wider ${
                isVault ? "text-stone-500" : "text-stone-400"
              }`}
            >
              Course
            </p>
            <h3
              className={`font-serif font-bold mt-0.5 truncate ${
                isVault ? "text-stone-50" : "text-stone-900"
              }`}
            >
              {courseTitle}
            </h3>
          </div>
        </div>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${
            allCaughtUp
              ? isVault
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
              : isVault
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-amber-50 text-amber-800 border-amber-100"
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
        <ProgressRing value={completionPercentage} tone={tone} isVault={isVault} />
        <div className="min-w-0 flex-1">
          <p
            className={`text-[11px] font-mono uppercase tracking-wider ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            {itemLabel === "quiz" ? "Attempted" : "Turned in"}
          </p>
          <p
            className={`text-sm font-medium leading-snug mt-0.5 ${
              isVault ? "text-stone-300" : "text-stone-700"
            }`}
          >
            {totalCount - pendingCount} of {totalCount} {itemLabel}
            {totalCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${
            isVault
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-emerald-50 border-emerald-100 text-emerald-700"
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          {completedCount} {completedLabel}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border ${
            isVault ? SCORE_CHIP[tone].vault : SCORE_CHIP[tone].light
          }`}
        >
          <Trophy className="w-3 h-3" />
          {hasScore ? `${averagePercentage}% avg` : "No grades yet"}
        </span>
      </div>

      <div
        className={`flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider transition pt-1 ${
          isVault
            ? "text-stone-500 group-hover:text-amber-400"
            : "text-stone-400 group-hover:text-amber-700"
        }`}
      >
        View {totalCount} {itemLabel}
        {totalCount === 1 ? "" : itemLabel === "quiz" ? "zes" : "s"}
        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}
