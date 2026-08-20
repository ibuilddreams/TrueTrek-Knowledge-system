"use client";

import { CheckCircle2, ChevronRight, GraduationCap, Layers } from "lucide-react";
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
  onViewDetails,
  onToggleSelect,
}) {
  const courseCount = pathway.course_count ?? 0;

  return (
    <div
      id={`pathway-card-${pathway.id}`}
      className={`bg-white border rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group ${
        isOwned
          ? "border-emerald-300"
          : isSelected
            ? "border-amber-500 ring-2 ring-amber-500/20"
            : "border-stone-200/80"
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md shrink-0 text-amber-700 bg-amber-50 flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              {courseCount} Course{courseCount === 1 ? "" : "s"}
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full border truncate bg-stone-50 text-stone-700 border-stone-200">
              {getTierLabel(pathway.tiers)}
            </span>
          </div>

          {isOwned ? (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold border px-2.5 py-1 rounded-full shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
              OWNED
            </span>
          ) : (
            isSelected && (
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold border px-2.5 py-1 rounded-full shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                <CheckCircle2 className="w-3 h-3 shrink-0 text-amber-600" />
                SELECTED
              </span>
            )
          )}
        </div>

        <h3 className="text-lg font-serif font-semibold tracking-tight mb-2 text-stone-900 group-hover:text-amber-800 transition-colors duration-250 line-clamp-2">
          {pathway.name}
        </h3>
        <p className="text-xs font-mono text-stone-400 mb-3 tracking-tight truncate">
          Focus: {getFocusLabel(pathway.tiers)}
        </p>
        <p className="text-[13px] leading-relaxed line-clamp-3 font-light mb-4 text-stone-600">
          {pathway.summary || "No summary has been added for this pathway yet."}
        </p>
      </div>

      <div className="pt-4 border-t border-stone-100 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[9px] font-mono font-semibold text-stone-400 block uppercase tracking-wider">
              Bundle Price
            </span>
            <span className="text-lg font-mono font-bold text-stone-900">
              {formatCoursePrice(pathway.base_price)}
            </span>
          </div>

          <button
            id={`pathway-view-details-${pathway.id}`}
            type="button"
            onClick={() => onViewDetails(pathway)}
            className="text-xs font-semibold text-amber-700 flex items-center gap-0.5 hover:gap-1.5 transition-all cursor-pointer"
          >
            View Pathway Details
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {isOwned ? (
          <span
            id={`pathway-owned-${pathway.id}`}
            className="w-full font-mono text-[10px] uppercase font-bold px-3 py-2.5 rounded-xl tracking-wider flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200"
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
            className={`w-full font-mono text-xs uppercase font-extrabold px-4 py-2.5 rounded-xl tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              isSelected
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-stone-950 hover:bg-stone-800 text-white"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isSelected ? "Selected" : "Select"}
          </button>
        ) : (
          <span
            className="w-full font-mono text-[10px] uppercase font-bold px-3 py-2.5 rounded-xl tracking-wider flex items-center justify-center gap-1.5 bg-stone-100 text-stone-400"
            title="Only student accounts can purchase pathways"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Student Only
          </span>
        )}
      </div>
    </div>
  );
}
