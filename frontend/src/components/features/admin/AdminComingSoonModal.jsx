"use client";

import { Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function AdminComingSoonModal({ isOpen, onClose, title, description }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={Sparkles} title={title} subtitle={description} maxWidth="max-w-sm">
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold font-mono rounded-lg tracking-wider uppercase transition-all cursor-pointer"
        >
          Got It
        </button>
      </div>
    </Modal>
  );
}
