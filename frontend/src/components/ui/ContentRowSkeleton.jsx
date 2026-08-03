"use client";

export default function ContentRowSkeleton({ count = 3 }) {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 bg-white"
        >
          <div className="w-4 h-4 rounded bg-stone-100 animate-pulse shrink-0" />
          <div className="w-9 h-9 rounded-lg bg-stone-100 animate-pulse shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-2/3 rounded bg-stone-100 animate-pulse" />
            <div className="h-2.5 w-1/3 rounded bg-stone-100 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-stone-100 animate-pulse" />
            <div className="w-7 h-7 rounded-lg bg-stone-100 animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
