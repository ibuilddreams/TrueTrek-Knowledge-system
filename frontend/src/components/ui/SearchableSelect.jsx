"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, Search } from "lucide-react";

const DROPDOWN_ESTIMATED_HEIGHT = 300;

// The two design systems this control renders under. "porcelain" is the
// original moss/pine treatment, unchanged, which the admin portal still uses;
// "cobalt" is the signed-in portal's own `cn-p-*` set. Keeping them as one
// table rather than a ternary per element is what stops the two drifting.
export const SELECT_PALETTES = {
  porcelain: {
    label: "font-sans text-muted block uppercase tracking-widest mb-1.5 font-medium",
    trigger:
      "px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper rounded-xl font-mono text-ink",
    value: "text-ink",
    placeholder: "text-muted",
    chevron: "text-muted",
    popup: "bg-paper border border-line rounded-xl shadow-elevated",
    searchRow: "border-b border-line",
    searchIcon: "text-muted",
    searchInput: "font-mono text-ink placeholder:text-muted",
    empty: "text-muted font-light",
    option: "px-4 py-2.5 font-mono text-ink hover:bg-porcelain",
    check: "text-pine",
    createRule: "border-t border-line",
    createInput:
      "px-3 py-2 bg-porcelain border border-line focus:border-pine focus:bg-paper rounded-lg font-mono text-ink placeholder:text-muted",
    createError: "font-mono text-red-600",
    createCancel: "font-mono uppercase tracking-wider text-muted hover:text-ink",
    createSave:
      "bg-pine hover:bg-moss text-paper font-mono uppercase tracking-wider rounded-lg",
    createOpen: "px-4 py-2.5 font-mono font-semibold text-pine hover:bg-sage/30",
    chip: "px-2.5 py-1 bg-gold/12 border border-gold/25 text-gold font-mono rounded-lg",
    chipRemove: "hover:text-ink",
  },
  cobalt: {
    label: "block mb-1.5 text-[13px] font-semibold text-cn-p-ink",
    trigger:
      "px-3 py-3 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent rounded-cn-p-sm text-cn-p-ink",
    value: "text-cn-p-ink",
    placeholder: "text-cn-p-muted",
    chevron: "text-cn-p-ink-2",
    popup: "bg-cn-p-card border border-cn-p-line rounded-cn-p-sm shadow-cn-p",
    searchRow: "border-b border-cn-p-line",
    searchIcon: "text-cn-p-muted",
    searchInput: "text-cn-p-ink placeholder:text-cn-p-muted",
    empty: "text-cn-p-ink-2",
    option: "px-4 py-2.5 text-cn-p-ink hover:bg-cn-p-page",
    check: "text-cn-p-accent",
    createRule: "border-t border-cn-p-line",
    createInput:
      "px-3 py-2 bg-cn-p-card border border-cn-p-line-2 focus:border-cn-p-accent rounded-cn-p-sm text-cn-p-ink placeholder:text-cn-p-muted",
    createError: "text-cn-p-bad",
    createCancel: "font-semibold text-cn-p-ink-2 hover:text-cn-p-ink",
    createSave:
      "bg-cn-p-accent hover:bg-cn-p-accent-hover text-white font-semibold rounded-cn-p-sm",
    createOpen: "px-4 py-2.5 font-semibold text-cn-p-accent hover:bg-cn-p-soft",
    chip: "h-6 px-2.5 bg-cn-p-soft text-cn-p-soft-ink font-semibold rounded-full",
    chipRemove: "hover:text-cn-p-ink",
  },
};

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
  tone = "porcelain",
}) {
  const P = SELECT_PALETTES[tone] ?? SELECT_PALETTES.porcelain;
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

  // Dismissing the dropdown with an outside click must not also hand that click
  // to whatever sits underneath it. These selects are used inside Modal, whose
  // backdrop closes the whole dialog on click, so clicking the backdrop to shut
  // the dropdown used to close the entire form with it — one click, two actions.
  // Closing happens on mousedown (as before); the click that follows is then
  // swallowed in the capture phase, before React's root listener can route it to
  // the backdrop.
  //
  // Both listeners are bound for the component's lifetime rather than scoped to
  // `isOpen`: setIsOpen(false) re-renders and would tear down an isOpen-scoped
  // effect before the click event arrives, taking the swallower with it.
  const isOpenRef = useRef(false);
  const swallowNextClickRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const handleMouseDown = (event) => {
      // A fresh gesture clears any flag a previous one left behind (a drag that
      // ended outside the window never produces a click).
      swallowNextClickRef.current = false;
      if (!isOpenRef.current) return;
      if (containerRef.current && containerRef.current.contains(event.target)) return;
      if (popupRef.current && popupRef.current.contains(event.target)) return;
      setIsOpen(false);
      swallowNextClickRef.current = true;
    };

    const handleClickCapture = (event) => {
      if (!swallowNextClickRef.current) return;
      swallowNextClickRef.current = false;
      event.stopPropagation();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("click", handleClickCapture, true);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("click", handleClickCapture, true);
    };
  }, []);

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
          className={`${smallSize} ${P.label}`}
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={disabled || loading}
        className={`w-full focus:outline-none ${P.trigger} ${bodySize} flex items-center justify-between gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <span className={`min-w-0 truncate ${selectedOption ? P.value : P.placeholder}`}>
          {loading ? "Loading..." : selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 ${P.chevron} shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen &&
        !loading &&
        popupStyle &&
        createPortal(
          <div
            ref={popupRef}
            style={{ ...popupStyle, zIndex: 200 }}
            className={`${P.popup} overflow-hidden flex flex-col`}>
          <div className={`p-2 ${P.searchRow} flex items-center gap-2 shrink-0`}>
            <Search className={`w-3.5 h-3.5 ${P.searchIcon} shrink-0`} />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full ${bodySize} ${P.searchInput} focus:outline-none`}
            />
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className={`px-4 py-3 ${bodySize} ${P.empty}`}>{emptyLabel}</li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`w-full flex items-center justify-between gap-2 ${P.option} ${bodySize} transition-colors text-left`}
                  >
                    <span className="min-w-0 truncate">{option.label}</span>
                    {option.value === value && <Check className={`w-3.5 h-3.5 ${P.check} shrink-0`} />}
                  </button>
                </li>
              ))
            )}
          </ul>

          {onCreate && (
            <div className={`${P.createRule} shrink-0`}>
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
                    className={`w-full focus:outline-none ${P.createInput} ${bodySize} transition disabled:opacity-60`}
                  />
                  {createError && (
                    <p className={`${smallSize} ${P.createError}`}>{createError}</p>
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
                      className={`px-3 py-1.5 ${smallSize} ${P.createCancel} disabled:opacity-60 disabled:cursor-not-allowed transition-colors`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateSubmit}
                      disabled={isSubmittingCreate}
                      className={`px-3 py-1.5 ${P.createSave} ${smallSize} disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-1.5`}
                    >
                      {isSubmittingCreate ? (
                        <>
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                  className={`w-full flex items-center gap-2 ${P.createOpen} ${bodySize} transition-colors text-left`}
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
