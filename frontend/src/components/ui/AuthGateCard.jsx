"use client";

import IconBadge from "@/components/ui/IconBadge";

export default function AuthGateCard({ id, icon, title, subtitle, children, size = "base" }) {
  return (
    <div
      id={id}
      className="min-h-[80vh] flex items-center justify-center py-16 px-6 bg-transparent"
    >
      <div className="w-full max-w-md p-8 sm:p-10 rounded-panel shadow-elevated relative overflow-hidden bg-paper border border-line">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine via-moss to-gold" />

        <div className="text-center mb-8">
          <IconBadge
            icon={icon}
            size="w-12 h-12"
            iconSize="w-6 h-6"
            className="mb-4 rounded-xl border bg-pine/10 text-pine border-pine/20"
            center
          />
          <h2 className="text-2xl font-serif font-light mb-1.5 text-ink">
            {title}
          </h2>
          <p className={`${size === "lg" ? "text-sm" : "text-xs"} font-light leading-relaxed text-muted`}>
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
