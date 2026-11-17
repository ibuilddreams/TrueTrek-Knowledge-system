"use client";

// `tone` picks the palette: "porcelain" (the default, unchanged) for the pages
// still on the moss/pine system, "cobalt" for the pages moved onto the new
// design system — a pine spinner on white paper reads as a stray colour.
export default function Loader({ fullScreen = true, label, tone = "porcelain" }) {
  const isCobalt = tone === "cobalt";
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${
          isCobalt ? "border-cn-accent" : "border-pine"
        }`}
        aria-hidden
      />
      {label && (
        <p
          className={`text-xs font-sans uppercase tracking-widest animate-pulse ${
            isCobalt ? "text-cn-muted" : "text-muted"
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );

  if (!fullScreen) {
    return spinner;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
      className={`min-h-[calc(100vh-5rem)] w-full flex items-center justify-center ${
        isCobalt ? "bg-cn-paper" : "cn-page-bg"
      }`}
    >
      {spinner}
    </div>
  );
}
