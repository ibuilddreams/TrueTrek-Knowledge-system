"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, Search } from "lucide-react";

const DROPDOWN_ESTIMATED_HEIGHT = 300;

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
  size = "base",
}) {
  const smallSize = size === "lg" ? "text-[11px]" : "text-[10px]";
  const bodySize = size === "lg" ? "text-sm" : "text-xs";
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [popupStyle, setPopupStyle] = useState(null);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value) || null;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && containerRef.current.contains(event.target)) return;
      if (popupRef.current && popupRef.current.contains(event.target)) return;
      setIsOpen(false);
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

    const updatePosition = () => {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < DROPDOWN_ESTIMATED_HEIGHT && spaceAbove > spaceBelow;

      setPopupStyle({
        position: "fixed",
        left: rect.left,
        width: rect.width,
        ...(openUpward
          ? { bottom: window.innerHeight - rect.top + 8, maxHeight: spaceAbove - 16 }
          : { top: rect.bottom + 8, maxHeight: spaceBelow - 16 }),
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
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
        <label
          className={`${smallSize} font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium`}
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled || loading}
        className={`w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl ${bodySize} font-mono text-ink flex items-center justify-between gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className={`min-w-0 truncate ${selectedOption ? "text-ink" : "text-muted"}`}>
          {loading ? "Loading..." : selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        !loading &&
        popupStyle &&
        createPortal(
          <div
            ref={popupRef}
            style={{ ...popupStyle, zIndex: 200 }}
            className="bg-paper border border-line rounded-xl shadow-elevated overflow-hidden flex flex-col">
          <div className="p-2 border-b border-line flex items-center gap-2 shrink-0">
            <Search className="w-3.5 h-3.5 text-muted shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full ${bodySize} font-mono text-ink placeholder:text-muted focus:outline-none`}
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className={`px-4 py-3 ${bodySize} text-muted font-light`}>{emptyLabel}</li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 ${bodySize} font-mono text-ink hover:bg-porcelain transition-colors text-left`}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {option.value === value && <Check className="w-3.5 h-3.5 text-pine shrink-0" />}
                  </button>
                </li>
              ))
            )}
          </ul>

          {onCreate && (
            <div className="border-t border-line shrink-0">
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
                    className={`w-full px-3 py-2 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-lg ${bodySize} font-mono text-ink placeholder:text-muted transition disabled:opacity-60`}
                  />
                  {createError && (
                    <p className={`${smallSize} font-mono text-red-600`}>{createError}</p>
                  )}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setNewOptionName("");
                        setCreateError("");
                      }}
                      disabled={isSubmittingCreate}
                      className={`px-3 py-1.5 ${smallSize} font-mono uppercase tracking-wider text-muted hover:text-ink disabled:opacity-60 disabled:cursor-not-allowed transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateSubmit}
                      disabled={isSubmittingCreate}
                      className={`px-3 py-1.5 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper ${smallSize} font-mono uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5`}
                    >
                      {isSubmittingCreate ? (
                        <>
                          <span className="w-3 h-3 border-2 border-paper border-t-transparent rounded-full animate-spin" />
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
                  className={`w-full flex items-center gap-2 px-4 py-2.5 ${bodySize} font-mono font-semibold text-pine hover:bg-sage/30 transition-colors text-left`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {createLabel}
                </button>
              )}
            </div>
          )}
          </div>,
          document.body
        )}
    </div>
  );
}
