"use client";

import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search...", id, size = "base" }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="w-3.5 h-3.5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full pl-9 pr-4 py-2.5 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl ${size === "lg" ? "text-sm" : "text-xs"} font-mono text-ink placeholder:text-muted transition`}
      />
    </div>
  );
}
