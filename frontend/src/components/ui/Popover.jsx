"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Minimal portal-based popover anchored to a trigger element. Mirrors the
 * fixed-position/outside-click/escape/scroll-close logic already proven in
 * AccountMenu, generalized so it can be reused anywhere a popover is
 * triggered from inside a scrolling container (a plain absolutely-positioned
 * popover would get clipped by that container's overflow).
 */
export default function Popover({ isOpen, onClose, anchorRef, children, width = 200, align = "end" }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const gap = 6;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left =
      align === "end"
        ? Math.min(Math.max(8, rect.right - width), viewportWidth - width - 8)
        : Math.min(Math.max(8, rect.left), viewportWidth - width - 8);

    // First pass: place below the anchor (the common case).
    setPosition({ top: rect.bottom + gap, left });

    // Second pass, once the popover has actually rendered and can be measured:
    // flip above the anchor instead if placing it below would run off the
    // bottom of the viewport (e.g. a composer toolbar near the page bottom).
    const frame = requestAnimationFrame(() => {
      const popoverEl = popoverRef.current;
      if (!popoverEl) return;
      const popoverHeight = popoverEl.getBoundingClientRect().height;
      if (rect.bottom + gap + popoverHeight > viewportHeight) {
        setPosition({ top: Math.max(8, rect.top - gap - popoverHeight), left });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen, anchorRef, align, width]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const inAnchor = anchorRef.current?.contains(event.target);
      const inPopover = popoverRef.current?.contains(event.target);
      if (!inAnchor && !inPopover) onClose();
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    // Scroll events don't bubble, but a capture-phase window listener still
    // sees scrolls from any descendant — including the popover's own
    // scrollable content (e.g. the emoji grid) — so ignore those instead of
    // closing the popover out from under the user mid-scroll.
    const handleScroll = (event) => {
      if (popoverRef.current?.contains(event.target)) return;
      onClose();
    };
    const handleResize = () => onClose();

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, anchorRef, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: "fixed", top: position.top, left: position.left, width }}
      className="z-50 border border-stone-200 rounded-xl shadow-2xl bg-white py-1.5 font-mono"
    >
      {children}
    </div>,
    document.body
  );
}
