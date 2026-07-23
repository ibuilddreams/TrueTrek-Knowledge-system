"use client";

export default function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 p-3 rounded-xl border border-stone-100 bg-stone-50/60 animate-pulse"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="h-3 rounded bg-stone-200 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
