"use client";

import { Gift, Lock } from "lucide-react";

const TYPE_LABELS = {
  MERCHANDISE: "Merchandise",
  MENTORSHIP: "Mentorship",
  DISCOUNT: "Discount",
  EXPERIENCE: "Experience",
  OTHER: "Reward",
};

export default function RewardCard({ reward, onRedeem }) {
  const canAfford = Boolean(reward.can_afford);

  return (
    <div className="relative bg-paper border border-line rounded-2xl shadow-sm p-5 flex flex-col gap-4 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold opacity-80" />

      <div className="flex items-start justify-between gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gold/12 border border-gold/25 text-gold flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted font-semibold">
          {TYPE_LABELS[reward.reward_type] || "Reward"}
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="text-base font-serif font-bold text-ink leading-snug">{reward.name}</h3>
        {reward.description && (
          <p className="text-xs text-muted font-light mt-1.5 leading-relaxed line-clamp-3">
            {reward.description}
          </p>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-line flex items-center justify-between gap-3">
        <span className="text-lg font-mono font-bold text-ink">
          {reward.points_required.toLocaleString()}
          <span className="text-[11px] font-sans font-normal text-muted ml-1">pts</span>
        </span>

        <button
          type="button"
          disabled={!canAfford}
          onClick={() => onRedeem(reward)}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold font-mono uppercase tracking-wider rounded-lg shadow-sm transition-all ${
            canAfford
              ? "bg-pine hover:bg-moss text-paper cursor-pointer"
              : "bg-porcelain text-muted cursor-not-allowed"
          }`}
        >
          {canAfford ? (
            "Redeem"
          ) : (
            <>
              <Lock className="w-3 h-3" />
              Not enough points
            </>
          )}
        </button>
      </div>
    </div>
  );
}
