"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export default function ActionMenu({ actions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const visibleActions = actions.filter(Boolean);

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 176;
      const estimatedHeight = visibleActions.length * 40 + 12;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpward = spaceBelow < estimatedHeight && rect.top > spaceBelow;

      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8
      );

      setMenuStyle({
        position: "fixed",
        top: openUpward ? undefined : rect.bottom + 8,
        bottom: openUpward ? window.innerHeight - rect.top + 8 : undefined,
        left,
        width: menuWidth,
        zIndex: 80,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, visibleActions.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const clickedButton = buttonRef.current?.contains(event.target);
      const clickedMenu = menuRef.current?.contains(event.target);
      if (!clickedButton && !clickedMenu) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (visibleActions.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 transition"
        title="Open row actions"
        aria-label="Open row actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen &&
        menuStyle &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={menuStyle}
            className="bg-white border border-stone-200 rounded-xl shadow-lg py-1.5 origin-top-right"
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
          </div>,
          document.body
        )}
    </>
  );
}
