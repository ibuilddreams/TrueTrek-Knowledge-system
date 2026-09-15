"use client";

export default function TabNav({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Sections",
  variant = "bar",
  size = "base",
}) {
  if (variant === "sidebar") {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        aria-orientation="vertical"
        className="flex flex-col gap-2"
      >
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              title={tab.title || tab.label}
              aria-label={tab.title || tab.label}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-pine/10 border-pine/25 text-pine shadow-xs"
                  : "bg-paper hover:bg-porcelain border-line text-muted"
              }`}
            >
              {TabIcon && (
                <TabIcon
                  className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${
                    isActive
                      ? "text-pine"
                      : "tabnav-sidebar-icon text-muted group-hover:text-ink"
                  }`}
                />
              )}
              <span className="min-w-0">
                <span
                  className={`block ${size === "lg" ? "text-sm" : "text-xs"} font-mono font-semibold tracking-wide uppercase`}
                >
                  {tab.label}
                </span>
                {tab.title && (
                  <span
                    className={`tabnav-sidebar-desc block ${size === "lg" ? "text-xs" : "text-[11px]"} text-muted mt-0.5 leading-tight font-sans font-light`}
                  >
                    {tab.title}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex border-b border-line overflow-x-auto whitespace-nowrap scrollbar-none gap-2 sm:gap-4 font-mono ${size === "lg" ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"} font-semibold tracking-wider uppercase text-muted`}
    >
      {tabs.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            title={tab.title || tab.label}
            aria-label={tab.title || tab.label}
            className={`shrink-0 pb-4 px-1 sm:px-3 flex items-center gap-2 border-b-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
              isActive
                ? "border-pine text-pine font-bold"
                : "border-transparent hover:text-ink"
            }`}
          >
            {TabIcon && <TabIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
