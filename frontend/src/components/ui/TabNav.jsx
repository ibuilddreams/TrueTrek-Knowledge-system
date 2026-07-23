"use client";

export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div
      role="tablist"
      aria-label="Admin sections"
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
