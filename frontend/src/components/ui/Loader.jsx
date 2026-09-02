"use client";

export default function Loader({ fullScreen = true, label }) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className="w-10 h-10 border-4 border-pine border-t-transparent rounded-full animate-spin"
        aria-hidden
      />
      {label && (
        <p className="text-xs font-sans uppercase tracking-widest animate-pulse text-muted">
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
      className="min-h-[calc(100vh-5rem)] w-full flex items-center justify-center cn-page-bg"
    >
      {spinner}
    </div>
  );
}
