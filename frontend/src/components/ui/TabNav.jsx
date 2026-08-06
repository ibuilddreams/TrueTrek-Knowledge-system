"use client";

export default function TabNav({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Sections",
  variant = "bar",
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
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 ${
                isActive
                  ? "bg-amber-100 border-amber-300/40 text-amber-600 shadow-xs"
                  : "bg-white hover:bg-stone-50 border-stone-200/80 text-stone-600"
              }`}
            >
              {TabIcon && (
                <TabIcon
                  className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${
                    isActive
                      ? "text-amber-600"
                      : "tabnav-sidebar-icon text-stone-400 group-hover:text-stone-900"
                  }`}
                />
              )}
              <span className="min-w-0">
                <span className="block text-xs font-mono font-semibold tracking-wide uppercase">
                  {tab.label}
                </span>
                {tab.title && (
                  <span className="tabnav-sidebar-desc block text-[11px] text-stone-500 mt-0.5 leading-tight font-sans font-light">
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
      className="flex w-full overflow-x-auto scrollbar-none gap-1.5 p-1.5 rounded-2xl border border-stone-200/90 bg-stone-100/70 shadow-inner"
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
            className={`relative flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-mono font-semibold tracking-wider uppercase whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 ${
              isActive
                ? "bg-white text-amber-800 shadow-sm border border-amber-200/80"
                : "text-stone-500 border border-transparent hover:text-stone-800 hover:bg-white/70"
            }`}
          >
            {TabIcon && (
              <TabIcon
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                  isActive ? "text-amber-700" : "text-stone-400"
                }`}
              />
            )}
            <span>{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-amber-700" />
            )}
          </button>
        );
      })}
    </div>
  );
}
