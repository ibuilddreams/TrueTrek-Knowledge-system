"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";

const DROPDOWN_ESTIMATED_HEIGHT = 300;

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
  onCreate,
  createLabel = "Add New",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [openUpward, setOpenUpward] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

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

  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setNewOptionName("");
      setCreateError("");
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUpward(spaceBelow < DROPDOWN_ESTIMATED_HEIGHT && spaceAbove > spaceBelow);
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

  const handleCreateSubmit = async (event) => {
    event?.preventDefault?.();
    const trimmed = newOptionName.trim();
    if (!trimmed) {
      setCreateError("Name is required.");
      return;
    }

    setIsSubmittingCreate(true);
    setCreateError("");
    try {
      const created = await onCreate(trimmed);
      if (created && !values.includes(created.value)) {
        onChange([...values, created.value]);
      }
      setIsCreating(false);
      setNewOptionName("");
      setQuery("");
    } catch (error) {
      setCreateError(error?.message || "Unable to create. Please try again.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-[10px] font-mono text-stone-450 block uppercase tracking-wider mb-1.5 font-semibold">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
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

        {isOpen && !loading && (
          <div
            className={`absolute z-20 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden ${
              openUpward ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
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

            {onCreate && (
              <div className="border-t border-stone-100 shrink-0">
                {isCreating ? (
                  <div className="p-2.5 space-y-1.5">
                    <input
                      autoFocus
                      type="text"
                      value={newOptionName}
                      onChange={(event) => {
                        setNewOptionName(event.target.value);
                        setCreateError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") handleCreateSubmit(event);
                      }}
                      disabled={isSubmittingCreate}
                      placeholder={`${createLabel} name`}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-lg text-xs font-mono text-stone-850 placeholder:text-stone-400 transition disabled:opacity-60"
                    />
                    {createError && <p className="text-[10px] font-mono text-red-600">{createError}</p>}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false);
                          setNewOptionName("");
                          setCreateError("");
                        }}
                        disabled={isSubmittingCreate}
                        className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-stone-500 hover:text-stone-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateSubmit}
                        disabled={isSubmittingCreate}
                        className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[10px] font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {isSubmittingCreate ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-semibold text-amber-700 hover:bg-amber-50 transition-colors text-left"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {createLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

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
    </div>
  );
}
