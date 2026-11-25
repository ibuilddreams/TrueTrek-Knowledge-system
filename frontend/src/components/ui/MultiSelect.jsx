"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus, Search, X } from "lucide-react";
import { SELECT_PALETTES } from "@/components/ui/SearchableSelect";

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
  size = "base",
  tone = "porcelain",
}) {
  const P = SELECT_PALETTES[tone] ?? SELECT_PALETTES.porcelain;
  const smallSize = size === "lg" ? "text-[11px]" : "text-[10px]";
  const bodySize = size === "lg" ? "text-sm" : "text-xs";
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [popupStyle, setPopupStyle] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popupRef = useRef(null);

  const selectedOptions = options.filter((option) => values.includes(option.value));

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
        <label
          className={`${smallSize} ${P.label}`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={disabled || loading}
          className={`w-full focus:outline-none ${P.trigger} ${bodySize} flex items-center justify-between gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          <span className={selectedOptions.length ? P.value : P.placeholder}>
            {loading ? "Loading..." : selectedOptions.length ? `${selectedOptions.length} selected` : placeholder}
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
              className={`${P.popup} overflow-hidden flex flex-col`}
            >
            <div className={`p-2 ${P.searchRow} flex items-center gap-2`}>
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
                filteredOptions.map((option) => {
                  const isSelected = values.includes(option.value);
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        onClick={() => toggleOption(option)}
                        className={`w-full flex items-center justify-between gap-2 ${P.option} ${bodySize} transition-colors text-left`}
                      >
                        <span>{option.label}</span>
                        {isSelected && <Check className={`w-3.5 h-3.5 ${P.check} shrink-0`} />}
                      </button>
                    </li>
                  );
                })
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

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedOptions.map((option) => (
            <span
              key={option.value}
              className={`inline-flex items-center gap-1 ${P.chip} ${smallSize}`}
            >
              {option.label}
              <button
                type="button"
                onClick={() => removeOption(option.value)}
                disabled={disabled}
                className={P.chipRemove}
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
