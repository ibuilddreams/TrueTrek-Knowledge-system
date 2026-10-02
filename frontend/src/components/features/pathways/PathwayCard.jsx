"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Layers,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { formatCoursePrice } from "@/lib/store";

function getTierLabel(tiers) {
  if (!tiers || tiers.length === 0) return "Standalone";
  if (tiers.length === 1) return `Tier ${tiers[0].level}`;
  return `${tiers.length} Tiers`;
}

function getFocusLabel(tiers) {
  if (!tiers || tiers.length === 0) return "Standalone pathway";
  return tiers.map((tier) => tier.name).join(" · ");
}

export default function PathwayCard({
  pathway,
  isSelected,
  isOwned = false,
  canSelect = true,
  onToggleSelect,
}) {
  const courseCount = pathway.course_count ?? 0;

  return (
    <div
      id={`pathway-card-${pathway.id}`}
      className={`relative bg-paper border rounded-card shadow-soft p-6 hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group ${
        isOwned
          ? "border-moss"
          : isSelected
            ? "border-gold ring-2 ring-gold/20"
            : "border-line"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-line pb-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-sans text-xs font-medium uppercase tracking-widest px-2.5 py-1 rounded-md shrink-0 text-[#8a6f2e] bg-gold/15 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              {courseCount} Course{courseCount === 1 ? "" : "s"}
            </span>
            <span className="text-[10px] uppercase font-sans tracking-widest font-medium px-2 py-0.5 rounded-full border truncate bg-porcelain text-ink border-line">
              {getTierLabel(pathway.tiers)}
            </span>
          </div>

          {isOwned ? (
            <span className="flex items-center gap-1 text-[10px] font-sans font-medium uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 bg-sage text-moss border-moss/30">
              <CheckCircle2 className="w-3 h-3 shrink-0 text-moss" />
              OWNED
            </span>
          ) : (
            isSelected && (
              <span className="flex items-center gap-1 text-[10px] font-sans font-medium uppercase tracking-widest border px-2.5 py-1 rounded-full shrink-0 bg-gold/15 text-[#8a6f2e] border-gold/30">
                <CheckCircle2 className="w-3 h-3 shrink-0 text-gold" />
                SELECTED
              </span>
            )
          )}
        </div>

        <h3 className="text-lg font-serif font-light tracking-tight mb-2 text-ink group-hover:text-moss transition-colors duration-250 line-clamp-2">
          {pathway.name}
        </h3>
        <p className="text-xs font-sans uppercase tracking-widest text-muted mb-3 truncate">
          Focus: {getFocusLabel(pathway.tiers)}
        </p>
        <p className="text-[13px] leading-relaxed line-clamp-3 font-light mb-4 text-muted">
          {pathway.summary || "No summary has been added for this pathway yet."}
        </p>
      </div>

      <div className="pt-4 border-t border-line space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-sans font-medium text-muted block uppercase tracking-widest">
              Bundle Price
            </span>
            <span className="text-lg font-sans font-semibold text-ink">
              {formatCoursePrice(pathway.base_price)}
            </span>
          </div>

          <span
            aria-hidden="true"
            className="text-xs font-semibold text-moss flex items-center gap-0.5 group-hover:gap-1.5 transition-all"
          >
            View Pathway Details
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Above the stretched link, so the action is not a navigation. */}
        <div className="relative z-10">
          {isOwned ? (
            <span
              id={`pathway-owned-${pathway.id}`}
              className="w-full font-sans text-[10px] uppercase font-medium px-3 py-2.5 rounded-full tracking-widest flex items-center justify-center gap-1.5 bg-sage text-moss border border-moss/30"
              title="You already have access to this pathway"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Already Purchased
            </span>
          ) : canSelect ? (
            <button
              id={`pathway-toggle-select-${pathway.id}`}
              type="button"
              onClick={() => onToggleSelect(pathway)}
              className={`w-full font-sans text-xs uppercase font-semibold px-4 py-2.5 rounded-full tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                isSelected
                  ? "bg-gold hover:brightness-95 text-ink"
                  : "bg-pine hover:bg-moss text-paper"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSelected ? "Selected" : "Select"}
            </button>
          ) : (
            <span
              className="w-full font-sans text-[10px] uppercase font-medium px-3 py-2.5 rounded-full tracking-widest flex items-center justify-center gap-1.5 bg-porcelain text-muted"
              title="Only student accounts can purchase pathways"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student Only
            </span>
          )}
        </div>
      </div>

      {/* Stretched link: the whole card opens the pathway page. Rendered last
          so it paints over the card body, while the action above opts out
          with z-10. Keeps the markup free of nested interactive elements. */}
      <Link
        id={`pathway-view-details-${pathway.id}`}
        href={`${ROUTES.PATHWAYS}/${pathway.slug}`}
        aria-label={`View ${pathway.name} details`}
        className="absolute inset-0 rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2"
      />
    </div>
  );
}
