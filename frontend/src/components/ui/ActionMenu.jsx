"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export default function ActionMenu({ actions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const visibleActions = actions.filter(Boolean);

  if (visibleActions.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition"
        title="Open row actions"
        aria-label="Open row actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 bg-white border border-stone-200 rounded-xl shadow-lg py-1.5 z-30 origin-top-right"
        >
          {visibleActions.map(({ key, label, icon: Icon, onSelect, tone = "default", disabled }) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              disabled={disabled}
              onClick={() => {
                setIsOpen(false);
                onSelect?.();
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold font-mono transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                tone === "danger" ? "text-rose-600 hover:bg-rose-50" : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
