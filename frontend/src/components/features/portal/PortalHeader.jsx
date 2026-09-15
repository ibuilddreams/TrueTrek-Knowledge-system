"use client";

import { Award, Flame, Medal, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import AccountMenu from "@/components/ui/AccountMenu";
import { ROUTES } from "@/constants/routes";
import { getUserLevelDetails } from "@/lib/portalLevels";
import { getInitials } from "./portalConstants";

// Task 16 (Phase 5) — mirrors daily_drill.services.get_streak_status's
// `status` field so the flame badge visually distinguishes a live streak
// from one that's at risk (today not done yet) or already broken, instead
// of always showing the same amber regardless of state.
const STREAK_STATUS_STYLE = {
  ACTIVE: { badge: "bg-gold/10 border-gold/20", icon: "text-gold" },
  AT_RISK: { badge: "bg-orange-500/10 border-orange-500/20", icon: "text-orange-400" },
  BROKEN: { badge: "bg-paper/5 border-paper/10", icon: "text-paper/40" },
  NEW: { badge: "bg-gold/10 border-gold/20", icon: "text-gold" },
};

export default function PortalHeader({
  displayName,
  profileStatus,
  points,
  streakDays,
  streakStatus,
  aggregateScore,
  onStreakClick,
}) {
  const router = useRouter();
  const levelInfo = getUserLevelDetails(points);
  const isLoading = profileStatus === "loading";
  const streakStyle = STREAK_STATUS_STYLE[streakStatus] || STREAK_STATUS_STYLE.ACTIVE;

  return (
    <div className="relative left-1/2 -translate-x-1/2 w-screen overflow-hidden cn-page-bg-vault mb-8 shadow-xl shadow-ink/20">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-6 sm:py-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full bg-gold/25 blur-md scale-110" />
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pine via-moss to-gold text-paper font-serif font-bold flex items-center justify-center text-xl sm:text-2xl shadow-[0_10px_24px_-12px_rgba(9,45,41,0.7)] ring-2 ring-paper/15">
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-paper/40 border-t-paper rounded-full animate-spin" />
              ) : (
                getInitials(displayName)
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-pine border-2 border-paper/20 text-gold flex items-center justify-center shadow-sm">
              <GraduationCap className="w-3 h-3" />
            </div>
          </div>

          <div className="min-w-0 pt-0.5">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="h-px w-4 bg-gold/70" />
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-gold">
                Student Portal
              </span>
            </div>
            {isLoading ? (
              <div className="h-8 w-48 bg-paper/10 rounded-md animate-pulse" />
            ) : (
              <h1 className="text-2xl sm:text-[2rem] font-serif font-bold tracking-tight text-paper truncate leading-none">
                {displayName}
              </h1>
            )}
            <p className="text-base text-paper/60 font-light mt-2 leading-snug max-w-md">
              Courses, certificates, daily drills, war room, and progress — in
              one place.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-linear-to-b from-paper/8 to-paper/3 border border-paper/10 p-3 rounded-xl flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase text-paper/70 tracking-wider">
                XP / Level
              </p>
              <p className="text-sm font-mono font-bold text-paper mt-0.5 truncate">
                {points} · Lvl {levelInfo.level}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStreakClick}
            title="View your full streak history"
            className="bg-linear-to-b from-paper/8 to-paper/3 border border-paper/10 p-3 rounded-xl flex items-center gap-3 text-left transition-colors hover:border-gold/40 hover:from-paper/12 cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${streakStyle.badge}`}
            >
              <Flame className={`w-4 h-4 ${streakStyle.icon}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase text-paper/70 tracking-wider">
                Streak
              </p>
              <p className="text-sm font-mono font-bold text-paper mt-0.5">
                {streakDays} Days
                {streakStatus === "AT_RISK" && (
                  <span className="ml-1.5 text-[10px] font-mono uppercase text-orange-400 align-middle">
                    At risk
                  </span>
                )}
              </p>
            </div>
          </button>

          <div className="bg-linear-to-b from-paper/8 to-paper/3 border border-paper/10 p-3 rounded-xl flex items-center gap-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
              <Medal className="w-4 h-4 text-gold" />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-[10px] font-mono uppercase text-paper/70 tracking-wider">
                Score
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-mono font-bold text-paper shrink-0">
                  {aggregateScore}%
                </p>
                <div className="w-14 bg-paper/15 h-1.5 rounded-full overflow-hidden shrink-0">
                  <motion.div
                    className="bg-gold h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${aggregateScore}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <AccountMenu
            variant="dark"
            className="w-full"
            onProfile={() => router.push(ROUTES.PROFILE)}
            onMessages={() => router.push(ROUTES.MESSAGES)}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}
