"use client";

import { ShieldAlert } from "lucide-react";
import CloseButton from "@/components/ui/CloseButton";

export default function CertifyTierModal({ tier, onClose, onCertify }) {
  if (!tier) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl relative">
        <CloseButton
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-900 p-1.5 hover:bg-stone-100 rounded-full transition"
          title="Close certification dialog"
        />

        <div className="space-y-1.5 pb-3 border-b border-stone-200 pr-10">
          <span className="text-amber-700 uppercase font-mono text-[10px] tracking-widest font-bold block">
            {tier.number} compliance dossier review
          </span>
          <h4 className="text-xl font-serif text-stone-900 font-black tracking-tight leading-tight">
            {tier.title}
          </h4>
          <p className="text-xs text-stone-500 font-light">{tier.subtitle}</p>
        </div>

        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-amber-700 font-bold">
              Course Content
            </p>
            <p className="text-stone-700 font-light leading-normal">{tier.desc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-stone-800">
                Focus Areas
              </span>
              <ul className="list-disc list-inside space-y-1 pt-1.5 leading-normal font-light">
                {tier.focusAreas.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
              <span className="block font-mono text-[9px] uppercase tracking-widest text-stone-800">
                Expected Outcomes
              </span>
              <ul className="list-disc list-inside space-y-1 pt-1.5 leading-normal font-light">
                {tier.outcomes.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/40 border border-amber-200/50 rounded-xl text-[11px] leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Academic Compliance Covenant:</strong> By certifying, you
              confirm you have studied this tier&apos;s modules and maintain
              regular drill habits.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stone-200 gap-3">
          <span className="text-xs font-mono text-stone-400">
            XP Reward: +200
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs transition font-semibold"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => onCertify(tier)}
              className="bg-stone-950 hover:bg-stone-800 text-white font-serif font-black text-xs px-5 py-2.5 rounded-xl transition shadow"
            >
              Certify & Earn Credit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
