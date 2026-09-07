"use client";

import { AlarmClockOff, Flame } from "lucide-react";

// Task 16/17 (Phase 5) — a soft, non-blocking notice only. Nothing in the
// student's access is restricted; this just surfaces the same
// current_streak/status/is_inactive signal the backend already computes
// (daily_drill.services.get_streak_status) so a broken streak or a few
// missed days aren't invisible to the student.
export default function StreakReengagementBanner({ streakDetail }) {
  if (!streakDetail) return null;

  const { status: streakStatus, is_inactive: isInactive, days_since_activity: daysSince } =
    streakDetail;

  if (!isInactive && streakStatus !== "BROKEN") return null;

  return (
    <div
      className={`rounded-2xl border p-4 flex items-start gap-3 ${
        isInactive
          ? "bg-rose-50 border-rose-200"
          : "bg-amber-50 border-amber-200"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
          isInactive
            ? "bg-rose-100 border-rose-200 text-rose-600"
            : "bg-amber-100 border-amber-200 text-amber-700"
        }`}
      >
        {isInactive ? <AlarmClockOff className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
      </div>
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold ${isInactive ? "text-rose-800" : "text-amber-800"}`}
        >
          {isInactive
            ? `You've been away for ${daysSince} days`
            : "Your streak reset"}
        </p>
        <p className={`text-xs mt-0.5 ${isInactive ? "text-rose-700" : "text-amber-700"}`}>
          {isInactive
            ? "Complete today's Daily Drill to pick your streak back up and stay on track."
            : "No worries — complete today's drill to start a new streak."}
        </p>
      </div>
    </div>
  );
}
