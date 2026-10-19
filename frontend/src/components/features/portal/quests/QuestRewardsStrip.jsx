"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Gift } from "lucide-react";
import { getRewardsCatalog } from "@/services/rewardsService";

/**
 * The "rewards" element the brief lists alongside task cards and progress:
 * what the points a student just earned are actually for.
 *
 * Shows the live balance and the next reward within reach, so the daily
 * tasks ladder up to something concrete rather than an abstract score.
 */
export default function QuestRewardsStrip({ onOpenRewards }) {
  const { data } = useQuery({
    queryKey: ["rewards", "catalog"],
    queryFn: async () => {
      const response = await getRewardsCatalog();
      return response?.data || { balance: 0, rewards: [] };
    },
  });

  const balance = data?.balance ?? 0;
  const rewards = data?.rewards || [];

  // The cheapest reward they can't afford yet — the one worth chasing. If
  // they can afford everything, celebrate that instead of inventing a goal.
  const nextReward = rewards
    .filter((reward) => reward.points_required > balance)
    .sort((a, b) => a.points_required - b.points_required)[0];

  const pointsAway = nextReward ? nextReward.points_required - balance : 0;
  const progressPercent = nextReward
    ? Math.min(100, Math.round((balance / nextReward.points_required) * 100))
    : 100;

  return (
    <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-5 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60 opacity-90" />

      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted">
              Your balance
            </p>
            <p className="text-lg font-mono font-bold text-ink tabular-nums">
              {balance.toLocaleString()}
              <span className="text-[11px] font-sans font-normal text-muted ml-1">pts</span>
            </p>
          </div>

          {nextReward ? (
            <>
              <p className="text-xs text-muted font-light mt-1.5 leading-relaxed">
                <span className="font-semibold text-ink">{pointsAway.toLocaleString()} pts</span>{" "}
                away from <span className="font-semibold text-ink">{nextReward.name}</span>
              </p>
              <div
                className="h-1.5 w-full rounded-full bg-porcelain overflow-hidden mt-2.5"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress toward ${nextReward.name}`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold transition-[width] duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-muted font-light mt-1.5 leading-relaxed">
              {rewards.length > 0
                ? "You can afford every reward in the catalog — go spend them."
                : "Earn points by completing your daily quests."}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenRewards}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold font-mono uppercase tracking-wider rounded-lg border border-line text-ink hover:bg-porcelain transition shrink-0 cursor-pointer"
        >
          Rewards
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
