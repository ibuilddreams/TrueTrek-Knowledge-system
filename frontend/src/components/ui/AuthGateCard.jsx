"use client";

import IconBadge from "@/components/ui/IconBadge";
import { useTheme } from "@/hooks/useTheme";

export default function AuthGateCard({ id, icon, title, subtitle, children }) {
  const { isVault } = useTheme();

  return (
    <div
      id={id}
      className="min-h-[80vh] flex items-center justify-center py-16 px-6 bg-transparent"
    >
      <div
        className={`w-full max-w-md p-8 sm:p-10 rounded-2xl shadow-xl relative overflow-hidden ${
          isVault
            ? "bg-[#161412] border border-stone-800"
            : "bg-white border border-stone-200/85"
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600 to-amber-800" />

        <div className="text-center mb-8">
          <IconBadge
            icon={icon}
            size="w-12 h-12"
            iconSize="w-6 h-6"
            className={`mb-4 rounded-xl border ${
              isVault
                ? "bg-amber-600/15 text-amber-500 border-amber-700/40"
                : "bg-amber-600/10 text-amber-700 border-amber-200/40"
            }`}
            center
          />
          <h2
            className={`text-2xl font-serif font-bold mb-1.5 ${
              isVault ? "text-stone-100" : "text-stone-900"
            }`}
          >
            {title}
          </h2>
          <p
            className={`text-xs font-light leading-relaxed ${
              isVault ? "text-stone-400" : "text-stone-500"
            }`}
          >
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
