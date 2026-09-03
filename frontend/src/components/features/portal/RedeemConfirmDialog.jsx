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
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 font-light">Cost</span>
          <span className="font-mono font-bold text-stone-800">{reward.points_required.toLocaleString()} pts</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500 font-light">Current balance</span>
          <span className="font-mono text-stone-700">{balance.toLocaleString()} pts</span>
        </div>
        <div className="flex items-center justify-between text-sm pt-2 border-t border-stone-100">
          <span className="text-stone-500 font-light">Remaining balance</span>
          <span className="font-mono font-bold text-emerald-700">{remaining.toLocaleString()} pts</span>
        </div>
      </div>

      {isSchedulable && (
        <div className="mb-6">
          <label className="text-[11px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold">
            Note for the admin (optional)
          </label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isConfirming}
            placeholder="e.g. I'd like to discuss my Tier 2 pathway."
            rows={3}
            maxLength={1000}
            className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-sm text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60 resize-none"
          />
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isConfirming}
          className="px-4 py-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 border border-stone-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onConfirm(note)}
          disabled={isConfirming}
          className="px-6 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 flex items-center justify-center gap-2"
        >
          {isConfirming ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
