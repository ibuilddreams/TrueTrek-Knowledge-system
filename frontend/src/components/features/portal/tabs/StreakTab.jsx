"use client";

import { AlertCircle, ArrowLeft, CalendarCheck, Flame, Trophy } from "lucide-react";
import { useStreakCalendar } from "@/hooks/student/useStreakCalendar";
import { useTheme } from "@/hooks/useTheme";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { formatPlainDate } from "@/lib/adminFormatters";
import Loader from "@/components/ui/Loader";
import StatCard from "@/components/ui/StatCard";
import YearStreakCalendar from "../streak/YearStreakCalendar";

// Task 16 (Phase 5) follow-up — the dedicated Streak page, reached from the
// portal header's Streak stat chip. Moved off the Daily Drill tab so a full
// year of activity data is only ever fetched when a student actually wants
// to see it, not on every "today's drill" load.
function BackToPortalLink({ onBack, isVault }) {
  if (!onBack) return null;
  return (
    <button
      type="button"
      onClick={onBack}
      className={`inline-flex items-center gap-1.5 px-3.5 py-2 border text-xs font-mono uppercase tracking-wider rounded-xl transition ${
        isVault
          ? "border-stone-700 hover:border-amber-500/50 hover:text-amber-400 text-stone-400"
          : "border-stone-200 hover:border-amber-300 hover:text-amber-800 text-stone-600"
      }`}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      Back to Dashboard
    </button>
  );
}

export default function StreakTab({ onBack }) {
  const { isVault } = useTheme();
  const { data, isLoading, isError, error, refetch } = useStreakCalendar();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackToPortalLink onBack={onBack} isVault={isVault} />
        <div
          className={`rounded-2xl p-6 min-h-[40vh] flex items-center justify-center border ${
            isVault ? "bg-[#161412] border-stone-800" : "bg-white border-stone-200"
          }`}
        >
          <Loader fullScreen={false} label="Loading your streak history..." />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        <BackToPortalLink onBack={onBack} isVault={isVault} />
        <div
          className={`rounded-2xl p-6 border ${
            isVault ? "bg-[#161412] border-stone-800" : "bg-white border-stone-200"
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 text-red-500 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className={`text-sm font-medium ${isVault ? "text-stone-300" : "text-stone-600"}`}>
              {getApiErrorMessage(error, "Unable to load your streak history.")}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-1 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm py-2 px-4 rounded-lg tracking-wide transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackToPortalLink onBack={onBack} isVault={isVault} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Current Streak" value={`${data.current_streak} Days`} icon={Flame} accent="amber" />
        <StatCard label="Longest Streak" value={`${data.longest_streak} Days`} icon={Trophy} accent="emerald" />
        <StatCard
          label="Active Days"
          value={data.total_active_days}
          icon={CalendarCheck}
          accent="stone"
          hint={`Since ${formatPlainDate(data.start_date)}`}
        />
      </div>

      <div
        className={`rounded-2xl border p-5 sm:p-6 ${
          isVault ? "bg-[#161412] border-stone-800" : "bg-white border-stone-200"
        }`}
      >
        <div className="flex items-center justify-between mb-5">
          <p
            className={`flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Daily Drill Activity
          </p>
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
            <span className={isVault ? "text-stone-500" : "text-stone-400"}>Missed</span>
            <span
              className={`w-3 h-3 rounded-[3px] border ${
                isVault ? "bg-white/5 border-stone-800" : "bg-stone-100 border-stone-200"
              }`}
            />
            <span className="w-3 h-3 rounded-[3px] bg-amber-500 border border-amber-600" />
            <span className={isVault ? "text-stone-500" : "text-stone-400"}>Completed</span>
          </div>
        </div>

        <YearStreakCalendar days={data.days} isVault={isVault} />
      </div>
    </div>
  );
}
