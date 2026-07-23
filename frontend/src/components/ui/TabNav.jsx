"use client";

export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none gap-1 font-mono text-xs font-semibold tracking-wider uppercase text-stone-500">
      {tabs.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative pb-3.5 px-3.5 flex items-center gap-2 border-b-2 transition-all rounded-t-lg ${
              isActive
                ? "border-amber-700 text-amber-800 font-bold bg-amber-50/50"
                : "border-transparent hover:text-stone-800 hover:bg-stone-50/80"
            }`}
            title={tab.title || tab.label}
            aria-label={tab.title || tab.label}
            aria-current={isActive ? "page" : undefined}
          >
            {TabIcon && (
              <TabIcon
                className={`w-4 h-4 ${isActive ? "text-amber-700" : ""}`}
              />
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
