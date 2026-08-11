"use client";

import { Filter } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function CurriculumFilterBar({ categories, selectedCategoryId, onSelect }) {
  const { isVault } = useTheme();

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 mb-12 border-b pb-6 ${
        isVault ? "border-stone-800" : "border-stone-200"
      }`}
    >
      <span
        className={`mr-2 font-mono text-xs flex items-center gap-1 ${
          isVault ? "text-stone-400" : "text-stone-500"
        }`}
      >
        <Filter className="w-3.5 h-3.5" /> Filter Category:
      </span>
      <button
        id="filter-category-all"
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-xs font-mono tracking-wide transition duration-300 border ${
          selectedCategoryId === null
            ? isVault
              ? "bg-amber-600 text-stone-950 border-amber-600 font-semibold"
              : "bg-stone-900 text-white border-stone-900 font-semibold"
            : isVault
              ? "bg-stone-900/60 hover:bg-stone-800 text-stone-400 border-stone-700"
              : "bg-white hover:bg-stone-100 text-stone-600 border-stone-200/80 shadow-xs"
        }`}
        title="Show all curriculum courses"
        aria-label="Show all curriculum courses"
      >
        All
      </button>
      {categories.map((category) => (
        <button
          id={`filter-category-${category.id}`}
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`px-4 py-2 rounded-full text-xs font-mono tracking-wide transition duration-300 border ${
            selectedCategoryId === category.id
              ? isVault
                ? "bg-amber-600 text-stone-950 border-amber-600 font-semibold"
                : "bg-stone-900 text-white border-stone-900 font-semibold"
              : isVault
                ? "bg-stone-900/60 hover:bg-stone-800 text-stone-400 border-stone-700"
                : "bg-white hover:bg-stone-100 text-stone-600 border-stone-200/80 shadow-xs"
          }`}
          title={`Filter curriculum courses to only show ${category.name}`}
          aria-label={`Filter curriculum courses to only show ${category.name}`}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
}
