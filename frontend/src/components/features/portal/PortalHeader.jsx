"use client";

import { Award, Flame, Medal, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import AccountMenu from "@/components/ui/AccountMenu";
import { ROUTES } from "@/constants/routes";
import { getUserLevelDetails } from "@/lib/portalLevels";
import { getInitials } from "./portalConstants";

export default function PortalHeader({
  displayName,
  profileStatus,
  points,
  streakDays,
  aggregateScore,
}) {
  const router = useRouter();
  const levelInfo = getUserLevelDetails(points);

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 mb-8 border-b border-stone-200">
      <div className="flex items-center gap-4 sm:gap-5 min-w-0">
        <div className="relative shrink-0">
          <div className="absolute inset-0 rounded-[1.15rem] bg-amber-500/25 blur-md scale-110" />
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[1.15rem] bg-gradient-to-br from-amber-400 via-amber-600 to-amber-800 text-white font-serif font-bold flex items-center justify-center text-xl sm:text-2xl shadow-[0_10px_24px_-12px_rgba(180,83,9,0.7)] ring-2 ring-white">
            {profileStatus === "loading" ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              getInitials(displayName)
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-stone-900 border-2 border-[#faf9f6] text-amber-400 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-3 h-3" />
          </div>
        </div>

        <div className="min-w-0 pt-0.5">
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="h-px w-4 bg-amber-500/70" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-700/90">
              Student Portal
            </span>
          </div>
          {profileStatus === "loading" ? (
            <div className="h-8 w-48 bg-stone-200/80 rounded-md animate-pulse" />
          ) : (
            <h1 className="text-2xl sm:text-[2rem] font-serif font-bold tracking-tight text-stone-900 truncate leading-none">
              {displayName}
            </h1>
          )}
          <p className="text-[13px] text-stone-500 font-light mt-2 leading-snug max-w-md">
            Courses, certificates, daily drills, war room, and progress — in one place.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-white border border-stone-200 p-3 rounded-xl flex items-center gap-3 min-w-[140px] shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4 text-amber-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">
              XP / Level
            </p>
            <p className="text-xs font-mono font-bold text-stone-900 mt-0.5 truncate">
              {points} · Lvl {levelInfo.level}
            </p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-3 rounded-xl flex items-center gap-3 min-w-[120px] shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-amber-700" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">
              Streak
            </p>
            <p className="text-xs font-mono font-bold text-stone-900 mt-0.5">
              {streakDays} Days
            </p>
          </div>
        </div>

        <div className="bg-white border border-stone-200 p-3 rounded-xl flex items-center gap-3 min-w-[150px] shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Medal className="w-4 h-4 text-amber-700" />
          </div>
          <div className="min-w-0 w-full">
            <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">
              Score
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs font-mono font-bold text-stone-900 shrink-0">
                {aggregateScore}%
              </p>
              <div className="w-14 bg-stone-100 h-1.5 rounded-full overflow-hidden shrink-0">
                <motion.div
                  className="bg-amber-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${aggregateScore}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>
        </div>

        <AccountMenu onProfile={() => router.push(ROUTES.PROFILE)} />
      </div>
    </div>
  );
}
