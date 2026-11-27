"use client";

import { Sparkles } from "lucide-react";
import Modal from "@/components/ui/Modal";

export default function TeacherComingSoonModal({ isOpen, onClose, title, description }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} icon={Sparkles} title={title} subtitle={description} maxWidth="max-w-sm">
      <div className="flex justify-end mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-3 bg-cn-p-accent hover:bg-cn-p-accent-hover text-white text-sm font-semibold rounded-cn-p-sm transition-all cursor-pointer"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}
