"use client";

import { Brain } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useTheme } from "@/hooks/useTheme";

export default function DailyDrillReminderModal({ isOpen, onClose, onLater, onStartDrill }) {
  const { isVault } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Brain}
      title="Your Daily Drill is ready"
      subtitle="Please complete your Daily Drill to earn points."
      maxWidth="max-w-sm"
    >
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-2">
        <button
          type="button"
          onClick={onLater}
          className={`px-4 py-3 text-xs font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 border shadow-sm ${
            isVault
              ? "bg-stone-800/60 hover:bg-stone-800 text-stone-300 border-stone-700"
              : "bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200"
          }`}
        >
          Later
        </button>
        <button
          type="button"
          onClick={onStartDrill}
          className={`px-6 py-3 text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 text-white ${
            isVault ? "bg-stone-700 hover:bg-stone-600" : "bg-stone-900 hover:bg-stone-800"
          }`}
        >
          Start Drill
        </button>
      </div>
    </Modal>
  );
}
