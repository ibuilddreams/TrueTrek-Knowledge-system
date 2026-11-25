"use client";

// `tone` picks the palette: "porcelain" (the default, unchanged) for the pages
// still on the moss/pine system, "cobalt" for the public pages moved onto the
// new design system, and "portal" for the signed-in portals, which have their
// own `cn-p-*` token set rather than the marketing one (the same three-tone
// split `ui/EmptyState` uses) — a pine spinner on white paper reads as a stray
// colour, and so does a cobalt one on the portal's grey page.
export default function Loader({ fullScreen = true, label, tone = "porcelain" }) {
  const isPortal = tone === "portal";
  const isCobalt = tone === "cobalt" || isPortal;
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin ${
          isPortal
            ? "border-cn-p-accent"
            : isCobalt
              ? "border-cn-accent"
              : "border-pine"
        }`}
        aria-hidden
      />
      {label && (
        <p
          className={`text-xs uppercase tracking-widest animate-pulse ${
            isPortal
              ? "font-sans text-cn-p-muted"
              : isCobalt
                ? "font-sans text-cn-muted"
                : "font-sans text-muted"
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
      // The portal routes render bare (no site navbar over them — see
      // `SiteShell`), so the portal tone owns the whole viewport; the other two
      // sit under the navbar and leave its 5rem alone.
      className={`w-full flex items-center justify-center ${
        isPortal
          ? "min-h-screen bg-cn-p-page"
          : `min-h-[calc(100vh-5rem)] ${isCobalt ? "bg-cn-paper" : "cn-page-bg"}`
      }`}
    >
      {spinner}
    </div>
  );
}
