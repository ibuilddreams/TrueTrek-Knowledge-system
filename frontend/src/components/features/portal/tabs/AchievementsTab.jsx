"use client";

import { useState } from "react";
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  Crown,
  Flame,
  Scale,
  Trophy,
  UserCheck,
  Zap,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CURRICULUM_TIERS } from "@/data/curriculum";
import { getUserLevelDetails } from "@/lib/portalLevels";
import { buildPortalBadges } from "../portalConstants";
import CertifyTierModal from "../CertifyTierModal";

const BADGE_ICONS = {
  UserCheck,
  Brain,
  Zap,
  Trophy,
  Scale,
  Flame,
  BookOpen,
  Crown,
};

function BadgeIcon({ name, unlocked }) {
  const Icon = BADGE_ICONS[name] || Award;
  return (
    <Icon
      className={`w-6 h-6 ${unlocked ? "text-amber-600" : "text-stone-400"}`}
    />
  );
}

export default function AchievementsTab({
  isLoggedIn,
  points,
  setPoints,
  completedModules,
  setCompletedModules,
  drillCompletedList,
  aggregateScore,
  consultationCount,
  streakDays,
  unlockedBadges,
  onNotify,
}) {
  const [auditingTier, setAuditingTier] = useState(null);
  const currentLevelInfo = getUserLevelDetails(points);
  const badges = buildPortalBadges({
    isLoggedIn,
    drillCompletedList,
    aggregateScore,
    consultationCount,
    streakDays,
    completedModules,
  });

  const levelProgress = Math.min(
    ((points - currentLevelInfo.prevThreshold) /
      (currentLevelInfo.nextThreshold - currentLevelInfo.prevThreshold)) *
      100,
    100
  );

  const milestones = [
    {
      label: "Operational Initiation",
      desc: "Exceed 500 cumulative Intelligence XP Points",
      progress: Math.min((points / 500) * 100, 100),
    },
    {
      label: "Drill Specialist",
      desc: "Complete 2 or more daily situational drills",
      progress: Math.min((drillCompletedList.length / 2) * 100, 100),
    },
    {
      label: "Scholar Certification",
      desc: "Certify and sign 3 educational curriculum modules",
      progress: Math.min((completedModules.length / 3) * 100, 100),
    },
    {
      label: "Council Advisory Link",
      desc: "Complete at least one consultation query in War Room",
      progress: Math.min(consultationCount * 100, 100),
    },
    {
      label: "Daily Resilience",
      desc: "Maintain situational drill streak of 7+ days",
      progress: Math.min((streakDays / 7) * 100, 100),
    },
  ];

  const handleCertify = (tier) => {
    if (completedModules.includes(tier.id)) return;

    setCompletedModules([...completedModules, tier.id]);
    setPoints((prev) => prev + 200);
    onNotify?.({
      title: "📚 MODULE CERTIFIED (+200 XP)",
      desc: `Compliance verified for ${tier.title}. Your certificate has been authenticated.`,
      type: "points",
    });
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#3b82f6", "#d97706", "#10b981"],
    });
    setAuditingTier(null);
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white rounded-2xl p-6 shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 flex-grow">
            <span className="text-amber-500 font-mono text-[10px] uppercase tracking-widest block font-medium">
              Scholar Index
            </span>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h4 className="text-2xl font-serif font-black tracking-tight">
                Level {currentLevelInfo.level}: {currentLevelInfo.name}
              </h4>
              <span className="text-xs text-amber-500/85 font-mono font-medium">
                ({points} XP)
              </span>
            </div>
            <div className="space-y-1.5 pt-1 max-w-xl">
              <div className="flex justify-between text-[11px] font-mono text-stone-400">
                <span>{currentLevelInfo.prevThreshold} XP</span>
                <span>XP to Level {currentLevelInfo.level + 1}</span>
                <span>{currentLevelInfo.nextThreshold} XP</span>
              </div>
              <div className="w-full bg-stone-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-stone-950/60 border border-stone-800 rounded-xl w-full md:w-auto shrink-0">
            <div className="text-center">
              <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">
                Total XP
              </p>
              <p className="text-base font-mono font-bold text-amber-500">
                {points}
              </p>
            </div>
            <div className="text-center sm:border-l sm:border-stone-800 sm:px-2">
              <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">
                Certified
              </p>
              <p className="text-base font-mono font-bold text-white">
                {completedModules.length} / 11
              </p>
            </div>
            <div className="text-center sm:border-l sm:border-stone-800 sm:px-2">
              <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">
                Drills
              </p>
              <p className="text-base font-mono font-bold text-white">
                {drillCompletedList.length} / 3
              </p>
            </div>
            <div className="text-center sm:border-l sm:border-stone-800 sm:px-2">
              <p className="text-[9px] font-mono uppercase text-stone-400 tracking-wider">
                Badges
              </p>
              <p className="text-base font-mono font-bold text-amber-500">
                {unlockedBadges.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <h4 className="text-lg font-serif font-bold text-stone-900">
              Medal Showcase
            </h4>
            <p className="text-stone-500 text-xs font-light">
              Accolades earned solving compliance and recruiting scenarios.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {badges.map((badge) => {
              const unlocked = unlockedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border flex gap-4 transition-all ${
                    unlocked
                      ? "bg-gradient-to-br from-amber-50/40 to-white border-amber-200/60 shadow-sm"
                      : "bg-stone-50/55 border-stone-200/80 opacity-60"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${
                      unlocked
                        ? "bg-amber-100/60 border border-amber-200"
                        : "bg-stone-200 border border-stone-300"
                    }`}
                  >
                    <BadgeIcon name={badge.icon} unlocked={unlocked} />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h5
                        className={`text-xs font-bold leading-none ${
                          unlocked ? "text-stone-900" : "text-stone-500"
                        }`}
                      >
                        {badge.title}
                      </h5>
                      {unlocked && (
                        <span className="bg-amber-100/60 text-amber-800 text-[8px] uppercase px-1 rounded font-semibold font-mono tracking-wide">
                          Earned
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 font-light leading-snug">
                      {badge.desc}
                    </p>
                    <div className="flex items-center gap-1 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
                      <Clock className="w-2.5 h-2.5" />
                      <span className="truncate">Guide: {badge.criteria}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-serif font-bold text-stone-900">
              Strategic Milestones
            </h4>
            <p className="text-stone-500 text-xs font-light">
              Checkpoint progress on your scholar path.
            </p>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4 shadow-sm">
            {milestones.map((milestone, index) => {
              const isDone = milestone.progress === 100;
              return (
                <div
                  key={index}
                  className="space-y-1.5 border-t border-stone-100 first:border-0 pt-3.5 first:pt-0"
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span
                      className={`font-semibold ${
                        isDone ? "text-amber-800" : "text-stone-700"
                      }`}
                    >
                      {milestone.label}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        isDone
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {isDone ? "DONE" : `${Math.round(milestone.progress)}%`}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-450 leading-tight font-light">
                    {milestone.desc}
                  </p>
                  <div className="w-full bg-stone-100 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        isDone ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h4 className="text-lg font-serif font-bold text-stone-900">
            Curriculum Certifications
          </h4>
          <p className="text-stone-500 text-xs font-light">
            Audit and certify tiers to earn 200 XP for each verification.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURRICULUM_TIERS.map((tier) => {
            const isCert = completedModules.includes(tier.id);
            return (
              <div
                key={tier.id}
                className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${
                  isCert
                    ? "border-emerald-200 bg-emerald-50/20"
                    : "border-stone-200 hover:border-amber-300 bg-white"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2.5 gap-2">
                    <span className="text-[9px] uppercase font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded border border-stone-200 font-semibold tracking-wider">
                      {tier.number}
                    </span>
                    {isCert ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded font-bold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Certified
                      </span>
                    ) : (
                      <span className="bg-amber-100/50 text-amber-800 text-[9px] uppercase font-mono tracking-widest px-2 py-0.5 rounded font-semibold border border-amber-200/40">
                        Pending
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm font-serif font-black text-stone-850 truncate leading-snug">
                    {tier.title}
                  </h5>
                  <p className="text-[11px] text-stone-500 leading-normal line-clamp-2 mt-1 font-light">
                    {tier.desc}
                  </p>
                </div>
                <div className="border-t border-dotted border-stone-200 mt-4 pt-3 flex justify-between items-center gap-2">
                  <span className="text-[9px] font-mono text-stone-400">
                    {tier.estimatedDuration}
                  </span>
                  {isCert ? (
                    <span className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
                      Credit Received
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAuditingTier(tier)}
                      className="bg-stone-900 hover:bg-stone-800 text-white font-serif font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition"
                    >
                      Review & Sign
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CertifyTierModal
        tier={auditingTier}
        onClose={() => setAuditingTier(null)}
        onCertify={handleCertify}
      />
    </div>
  );
}
