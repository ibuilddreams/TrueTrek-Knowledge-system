"use client";

import { Gift, Lock } from "lucide-react";
import { PortalBar } from "./shell/PortalCard";
import { PortalButton, PortalPill } from "./shell/PortalUI";

const TYPE_LABELS = {
  MERCHANDISE: "Merchandise",
  MENTORSHIP: "Mentorship",
  DISCOUNT: "Discount",
  EXPERIENCE: "Experience",
  OTHER: "Reward",
};

// One reward as the design draws it: what kind it is and what it costs on the
// top line, then the name and the pitch, then — the part the old card had no
// answer for — how close the reader is to affording it.
//
// `balance` is optional. The server already says whether a reward is
// affordable (`can_afford`), so the bar is extra rather than load-bearing, and
// a caller that has no balance to hand simply gets the card without it instead
// of a bar drawn against a zero it invented.
export default function RewardCard({ reward, balance, onRedeem }) {
  const canAfford = Boolean(reward.can_afford);
  const cost = reward.points_required;
  const hasBalance = typeof balance === "number";
  const shortfall = hasBalance ? Math.max(0, cost - balance) : null;
  const progress = hasBalance && cost > 0 ? Math.min(100, (balance / cost) * 100) : 0;

  return (
    <div className="flex flex-col gap-2.5 rounded-cn-p border border-cn-p-line bg-cn-p-card p-5">
      <div className="flex items-center justify-between gap-3">
        <PortalPill tone="blue">
          <Gift className="h-3.5 w-3.5" />
          {TYPE_LABELS[reward.reward_type] || "Reward"}
        </PortalPill>
        <b className="font-bold tabular-nums text-cn-p-accent">
          {cost.toLocaleString()} pts
        </b>
      </div>

      <b className="text-[17px] leading-snug font-bold text-cn-p-ink">{reward.name}</b>
      {reward.description && (
        <p className="line-clamp-3 text-sm leading-relaxed text-cn-p-ink-2">
          {reward.description}
        </p>
      )}

      <div className="mt-auto grid gap-1.5 pt-2">
        {hasBalance && (
          <>
            <span className="text-xs text-cn-p-muted">
              {shortfall === 0
                ? "You can redeem this"
                : `${shortfall.toLocaleString()} more points needed`}
            </span>
            <PortalBar value={progress} />
          </>
        )}
      </div>

      <PortalButton
        size="sm"
        disabled={!canAfford}
        onClick={() => onRedeem(reward)}
        className="mt-1 w-full"
      >
        {canAfford ? (
          "Redeem"
        ) : (
          <>
            <Lock className="h-3.5 w-3.5" />
            Not enough points
          </>
        )}
      </PortalButton>
    </div>
  );
}
