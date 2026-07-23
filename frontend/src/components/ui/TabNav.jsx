"use client";

export default function TabNav({ tabs, activeTab, onChange }) {
  return (
    <div className="flex border-b border-stone-200/80 mb-8 overflow-x-auto whitespace-nowrap scrollbar-none gap-2 font-mono text-xs font-semibold tracking-wider uppercase text-stone-500">
      {tabs.map((tab) => {
        const TabIcon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`pb-4 px-3 flex items-center gap-2 border-b-2 transition-all ${
              isActive ? "border-amber-700 text-amber-800 font-bold" : "border-transparent hover:text-stone-850"
            }`}
            title={tab.title || tab.label}
            aria-label={tab.title || tab.label}
          >
            {TabIcon && <TabIcon className="w-4 h-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
