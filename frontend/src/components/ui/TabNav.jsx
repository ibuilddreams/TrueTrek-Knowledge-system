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
      className="flex border-b border-stone-200/80 overflow-x-auto whitespace-nowrap scrollbar-none gap-2 sm:gap-4 font-mono text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-stone-500"
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
            className={`shrink-0 pb-4 px-1 sm:px-3 flex items-center gap-2 border-b-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 ${
              isActive
                ? "border-amber-700 text-amber-800 font-bold"
                : "border-transparent hover:text-stone-800"
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
