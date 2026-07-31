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
      <div className="flex items-start gap-4 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black flex items-center justify-center text-lg shadow-md shrink-0">
          {profileStatus === "loading" ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            getInitials(displayName)
          )}
        </div>
        <div className="min-w-0">
          <span className="text-amber-600 font-mono text-xs uppercase tracking-widest font-bold block mb-1">
            Student Portal
          </span>
          {profileStatus === "loading" ? (
            <div className="h-7 w-48 bg-stone-200 rounded-md animate-pulse" />
          ) : (
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-stone-900 flex items-center gap-2.5 truncate">
              <GraduationCap className="w-7 h-7 text-amber-700 shrink-0 hidden sm:block" />
              {displayName}
            </h1>
          )}
          <p className="text-sm text-stone-500 font-light mt-0.5">
            Track drills, consult advisors, and certify curriculum progress.
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
