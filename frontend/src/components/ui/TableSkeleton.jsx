"use client";

// Only DataTable renders this, so it takes the same `tone` and the default
// stays the porcelain skeleton the admin portal's own screens still show.
export default function TableSkeleton({ rows = 5, columns = 4, tone = "porcelain" }) {
  const isCobalt = tone === "cobalt";
  return (
    <div className={isCobalt ? "space-y-2 p-4" : "space-y-2"}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={`flex items-center gap-4 p-3 animate-pulse ${
            isCobalt
              ? "rounded-cn-p-sm border border-cn-p-line bg-cn-p-page"
              : "rounded-xl border border-line bg-porcelain/60"
          }`}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={`h-3 rounded flex-1 ${isCobalt ? "bg-cn-p-track" : "bg-line"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
