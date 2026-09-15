"use client";

import { Brain } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function DailyDrillReminderModal({ isOpen, onClose, onLater, onStartDrill }) {
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
          className="px-4 py-3 text-xs font-semibold font-mono rounded-lg tracking-wider transition-colors duration-150 border shadow-sm bg-transparent hover:bg-porcelain text-ink border-line"
        >
          Later
        </button>
        <button
          type="button"
          onClick={onStartDrill}
          className="px-6 py-3 text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-colors duration-150 text-paper bg-pine hover:bg-moss"
        >
          Start Drill
        </button>
      </div>
    </Modal>
  );
}
