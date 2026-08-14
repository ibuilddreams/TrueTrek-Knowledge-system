"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Search } from "lucide-react";

export default function SearchableSelect({
  label,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  options = [],
  value,
  onChange,
  disabled = false,
  loading = false,
  emptyLabel = "No results found.",
  onCreate,
  createLabel = "Add New",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const containerRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value) || null;

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

  const handleSelect = (option) => {
    onChange(option.value);
    setQuery("");
    setIsOpen(false);
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
      if (created) onChange(created.value);
      setIsCreating(false);
      setNewOptionName("");
      setIsOpen(false);
    } catch (error) {
      setCreateError(error?.message || "Unable to create. Please try again.");
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="text-[10px] font-mono text-stone-500 block uppercase tracking-wider mb-1.5 font-semibold">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled || loading}
        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-xl text-xs font-mono text-stone-800 flex items-center justify-between gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className={`min-w-0 truncate ${selectedOption ? "text-stone-800" : "text-stone-400"}`}>
          {loading ? "Loading..." : selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !loading && (
        <div className="absolute z-20 mt-2 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="p-2 border-b border-stone-100 flex items-center gap-2 shrink-0">
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
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-xs font-mono text-stone-700 hover:bg-stone-50 transition-colors text-left"
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {option.value === value && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  </button>
                </li>
              ))
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
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 focus:border-amber-600 focus:bg-white focus:outline-none rounded-lg text-xs font-mono text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60"
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
  );
}
