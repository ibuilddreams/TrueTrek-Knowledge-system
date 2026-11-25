"use client";

import { Search } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  id,
  size = "base",
  // Width of the wrapper — override for layouts that need a full-width field.
  className = "w-full sm:max-w-xs",
  // Fill + type treatment. The default is the data-table look; toolbars that
  // sit beside FilterSelect pass the matching paper/sans treatment.
  inputClassName = "bg-porcelain font-mono focus:bg-paper",
  // "cobalt" renders the portal design's `.search` field instead; the default
  // is unchanged for the admin portal and the public site.
  tone = "porcelain",
}) {
  const isCobalt = tone === "cobalt";

  if (isCobalt) {
    return (
      <div className={`relative ${className}`}>
        <Search
          aria-hidden="true"
          className="absolute top-1/2 left-3.5 h-[18px] w-[18px] -translate-y-1/2 text-cn-p-muted"
        />
        <input
          id={id}
          type="text"
          aria-label={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card pr-4 pl-10 text-sm text-cn-p-ink transition outline-none placeholder:text-cn-p-muted focus:border-cn-p-accent"
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="w-3.5 h-3.5 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        id={id}
        type="text"
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full pl-9 pr-4 py-2.5 border border-line focus:border-pine focus:outline-none rounded-xl ${size === "lg" ? "text-sm" : "text-xs"} text-ink placeholder:text-muted transition ${inputClassName}`}
      />
    </div>
  );
}
