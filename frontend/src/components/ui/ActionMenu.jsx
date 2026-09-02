"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
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
      const longestLabelLength = Math.max(...visibleActions.map(({ label }) => label.length));
      const menuWidth = Math.min(240, Math.max(176, longestLabelLength * 7 + 64));
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
        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 ${
          isOpen
            ? "bg-porcelain border-line text-ink"
            : "border-line text-muted hover:bg-porcelain hover:text-ink"
        }`}
        title="Open row actions"
        aria-label="Open row actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {isOpen && menuStyle && (
              <motion.div
                ref={menuRef}
                role="menu"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={menuStyle}
                className="font-sans border rounded-xl shadow-elevated py-1.5 origin-top-right bg-paper border-line"
              >
                {visibleActions.map(({ key, label, icon: Icon, onSelect, tone = "default", disabled }) => (
                  <button
                    key={key}
                    type="button"
                    role="menuitem"
                    disabled={disabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsOpen(false);
                      onSelect?.();
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-left whitespace-nowrap transition-colors duration-150 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                      tone === "danger"
                        ? "text-rose-600 hover:bg-rose-50 focus:bg-rose-50"
                        : "text-ink hover:bg-porcelain focus:bg-porcelain"
                    }`}
                  >
                    {Icon && (
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          tone === "danger" ? "text-rose-500" : "text-muted"
                        }`}
                      />
                    )}
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
