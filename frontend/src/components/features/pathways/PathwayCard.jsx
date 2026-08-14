"use client";

import { CheckCircle2, GraduationCap, Info, Layers, Route } from "lucide-react";
import { formatCoursePrice } from "@/lib/store";

export default function PathwayCard({
  pathway,
  isSelected,
  canSelect = true,
  onViewDetails,
  onToggleSelect,
}) {
  return (
    <div
      id={`pathway-card-${pathway.id}`}
      className={`bg-white border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${
        isSelected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-stone-200"
      }`}
    >
      <div>
        <div className="relative h-56 overflow-hidden bg-stone-100">
          {pathway.image ? (
            <img
              src={pathway.image}
              alt={pathway.name}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-stone-800 to-stone-950">
              <Route className="w-10 h-10 text-amber-500/70" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 to-transparent"></div>

          <span className="absolute top-4 left-4 text-[9px] font-mono tracking-wider font-extrabold uppercase bg-stone-950/80 text-amber-500 border border-stone-800/80 px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1.5">
            <Layers className="w-3 h-3" />
            {pathway.course_count} Course{pathway.course_count === 1 ? "" : "s"}
          </span>

          {isSelected && (
            <span className="absolute bottom-4 right-4 text-[9px] font-mono font-bold bg-amber-600 text-white px-2.5 py-1 rounded-md shadow-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Selected
            </span>
          )}
        </div>

        <div className="p-6 space-y-3">
          <h3 className="text-base font-serif font-bold tracking-tight text-stone-900 group-hover:text-amber-800 transition-colors line-clamp-2">
            {pathway.name}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light line-clamp-3">
            {pathway.summary || "No summary has been added for this pathway yet."}
          </p>
        </div>
      </div>

      <div className="p-6 pt-0 border-t border-stone-100 mt-4 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono font-semibold text-stone-400 block uppercase tracking-wider">
            Bundle Price
          </span>
          <span className="text-xl font-mono font-bold text-stone-900">
            {formatCoursePrice(pathway.base_price)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`pathway-view-details-${pathway.id}`}
            type="button"
            onClick={() => onViewDetails(pathway)}
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 p-2.5 rounded-xl text-xs transition duration-200"
            title="View Pathway Details"
          >
            <Info className="w-4 h-4" />
          </button>
          {canSelect ? (
            <button
              id={`pathway-toggle-select-${pathway.id}`}
              type="button"
              onClick={() => onToggleSelect(pathway)}
              className={`font-mono text-xs uppercase font-extrabold px-4 py-2.5 rounded-xl tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
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
              className="font-mono text-[10px] uppercase font-bold px-3 py-2.5 rounded-xl tracking-wider flex items-center gap-1.5 bg-stone-100 text-stone-400"
              title="Only student accounts can purchase pathways"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student Only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
