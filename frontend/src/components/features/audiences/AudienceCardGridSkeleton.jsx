"use client";

// Placeholder cards in the real grid's shape. A centred spinner collapses the
// page to nothing and then shoves everything down when the data lands; these
// hold the layout steady so only the content fades in.
export default function AudienceCardGridSkeleton({ count = 6, variant = "pathway" }) {
  return (
    <div
      aria-hidden="true"
      className="grid animate-pulse grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-card border border-line bg-paper/70 shadow-soft"
        >
          {variant === "course" && <div className="h-56 w-full bg-porcelain" />}

          <div className="space-y-4 p-6">
            <div className="flex gap-2">
              <div className="h-5 w-24 rounded-md bg-porcelain" />
              <div className="h-5 w-16 rounded-full bg-porcelain" />
            </div>

            <div className="space-y-2">
              <div className="h-5 w-4/5 rounded bg-porcelain" />
              <div className="h-3 w-full rounded bg-porcelain" />
              <div className="h-3 w-2/3 rounded bg-porcelain" />
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4">
              <div className="h-6 w-20 rounded bg-porcelain" />
              <div className="h-8 w-28 rounded-full bg-porcelain" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
