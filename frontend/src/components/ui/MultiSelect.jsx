"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export default function MultiSelect({
  label,
  placeholder = "Select options",
  searchPlaceholder = "Search...",
  options = [],
  values = [],
  onChange,
  disabled = false,
  loading = false,
  emptyLabel = "No results found.",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  const selectedOptions = options.filter((option) => values.includes(option.value));

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

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

  const toggleOption = (option) => {
    if (values.includes(option.value)) {
      onChange(values.filter((value) => value !== option.value));
    } else {
      onChange([...values, option.value]);
    }
  };

  const removeOption = (value) => {
    onChange(values.filter((item) => item !== value));
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled || loading}
        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-850 flex items-center justify-between gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={selectedOptions.length ? "text-stone-850" : "text-stone-400"}>
          {loading ? "Loading..." : selectedOptions.length ? `${selectedOptions.length} selected` : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600/10 border border-amber-200/40 text-amber-800 text-[10px] font-mono rounded-lg"
            >
              {option.label}
              <button
                type="button"
                onClick={() => removeOption(option.value)}
                disabled={disabled}
                className="hover:text-amber-950"
                aria-label={`Remove ${option.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {isOpen && !loading && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-stone-100 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-xs font-mono text-stone-800 placeholder:text-stone-400 focus:outline-none"
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-xs text-stone-400 font-light">{emptyLabel}</li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      onClick={() => toggleOption(option)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-mono text-stone-700 hover:bg-stone-50 transition-colors text-left"
                    >
                      <span>{option.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
