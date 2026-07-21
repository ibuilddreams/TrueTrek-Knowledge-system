"use client";

import IconBadge from "@/components/ui/IconBadge";

export default function AuthGateCard({ id, icon, title, subtitle, children }) {
  return (
    <div id={id} className="min-h-[80vh] flex items-center justify-center bg-[#faf9f6] py-16 px-6">
      <div className="w-full max-w-md bg-white border border-stone-200/85 p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800"></div>

        <div className="text-center mb-8">
          <IconBadge
            icon={icon}
            size="w-12 h-12"
            iconSize="w-6 h-6"
            className="bg-amber-600/10 text-amber-700 rounded-xl border border-amber-200/40"
            center
          />
          <h2 className="text-2xl font-serif text-stone-900 font-bold mb-1.5">{title}</h2>
          <p className="text-stone-500 text-xs font-light">{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}
