"use client";

import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search...", id }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-800 placeholder:text-stone-400 transition"
      />
    </div>
  );
}
