"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function RedeemConfirmDialog({ isOpen, onClose, onConfirm, reward, balance, isConfirming }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (isOpen) setNote("");
  }, [isOpen, reward]);

  if (!reward) return null;

  const remaining = Math.max(balance - reward.points_required, 0);
  const isSchedulable = reward.fulfillment_type === "SCHEDULED_SESSION" || reward.fulfillment_type === "EVENT_ACCESS";

  return (
    <Modal
      isOpen={isOpen}
      onClose={isConfirming ? undefined : onClose}
      icon={Gift}
      title={`Redeem "${reward.name}"?`}
      subtitle="This will deduct points from your balance immediately."
      maxWidth="max-w-sm"
    >
      {/* The design's `.kv`: the three numbers that answer "can I, and what
          am I left with" side by side rather than as prose. */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-cn-p-sm bg-cn-p-page px-3.5 py-3">
          <span className="block text-xs text-cn-p-ink-2">Cost</span>
          <b className="block text-base font-bold tabular-nums text-cn-p-ink">{reward.points_required.toLocaleString()}</b>
        </div>
        <div className="rounded-cn-p-sm bg-cn-p-page px-3.5 py-3">
          <span className="block text-xs text-cn-p-ink-2">Balance now</span>
          <b className="block text-base font-bold tabular-nums text-cn-p-ink">{balance.toLocaleString()}</b>
        </div>
        <div className="rounded-cn-p-sm bg-cn-p-page px-3.5 py-3">
          <span className="block text-xs text-cn-p-ink-2">After</span>
          <b className="block text-base font-bold tabular-nums text-cn-p-ok">{remaining.toLocaleString()}</b>
        </div>
      </div>

      {isSchedulable && (
        <div className="mb-6">
          <label className="mb-1.5 block text-sm font-semibold text-cn-p-ink">
            Note for the admin (optional)
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isConfirming}
            placeholder="e.g. I'd like to discuss my Tier 2 pathway."
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3.5 py-2.5 text-sm text-cn-p-ink transition-[border-color] duration-150 placeholder:text-cn-p-muted hover:border-cn-p-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-p-accent disabled:opacity-60"
          />
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isConfirming}
          className="inline-flex h-11 items-center justify-center rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-[18px] text-sm font-semibold text-cn-p-ink transition-colors duration-150 hover:border-cn-p-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(note)}
          disabled={isConfirming}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-cn-p-sm bg-cn-p-accent px-[18px] text-sm font-semibold text-white transition-colors duration-150 hover:bg-cn-p-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isConfirming ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Redeeming...
            </>
          ) : (
            "Confirm Redemption"
          )}
        </button>
      </div>
    </Modal>
  );
}
