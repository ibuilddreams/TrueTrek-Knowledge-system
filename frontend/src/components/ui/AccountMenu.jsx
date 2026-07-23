"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLogoutFlow } from "@/hooks/useLogoutFlow";
import { getProfile } from "@/services/profileService";

const FALLBACK_LABEL = "My Account";

function getFirstName(name) {
  const firstWord = name?.trim().split(/\s+/)[0];
  return firstWord || FALLBACK_LABEL;
}

export default function AccountMenu({ label, onProfile, variant = "light" }) {
  const isDark = variant === "dark";
  const { user } = useAuth();
  const { isSigningOut, signOut } = useLogoutFlow();
  const [backendProfile, setBackendProfile] = useState(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const response = await getProfile();
        if (isMounted) setBackendProfile(response?.data || null);
      } catch {
        if (isMounted) setBackendProfile(null);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayLabel =
    label || getFirstName(backendProfile?.full_name || user?.name);
  const roleLabel = !label ? backendProfile?.role || undefined : undefined;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

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
    if (isOpen) {
      itemRefs.current[0]?.focus();
    }
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  const handleItemKeyDown = (event, index, total) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      itemRefs.current[(index + 1) % total]?.focus();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      itemRefs.current[(index - 1 + total) % total]?.focus();
      return;
    }
    if (event.key === "Tab") {
      closeMenu();
    }
  };

  const menuItems = [
    { key: "profile", label: "Profile", icon: User, onSelect: onProfile, disabled: false },
    { key: "sign-out", label: "Sign Out", icon: LogOut, onSelect: signOut, disabled: isSigningOut },
  ];

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        id="account-menu-trigger"
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        disabled={isSigningOut}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={
          "px-4 py-2.5 text-xs font-semibold font-mono rounded-xl tracking-wider hover:scale-[1.01] transition-all flex items-center gap-2 border shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 " +
          (isDark
            ? "bg-stone-850 hover:bg-stone-800 border-stone-800"
            : "bg-stone-50 hover:bg-stone-100 border-stone-200")
        }
        title="Open account menu"
        aria-label="Open account menu"
      >
        <User className="w-4 h-4 text-stone-400 shrink-0" />
        <span className="flex flex-col items-start leading-tight text-left">
          <span className={`font-semibold ${isDark ? "text-stone-100" : "text-stone-800"}`}>
            {displayLabel}
          </span>
          {roleLabel && (
            <span className="text-[11px] font-normal tracking-normal normal-case text-stone-400 mt-0.5">
              {roleLabel}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-labelledby="account-menu-trigger"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white border border-stone-200 rounded-xl shadow-lg py-1.5 z-50 origin-top-right"
          >
            {menuItems.map(({ key, label: itemLabel, icon: Icon, onSelect, disabled }, index) => (
              <button
                key={key}
                ref={(el) => (itemRefs.current[index] = el)}
                type="button"
                role="menuitem"
                disabled={disabled}
                onClick={() => {
                  closeMenu();
                  onSelect?.();
                }}
                onKeyDown={(event) => handleItemKeyDown(event, index, menuItems.length)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold font-mono text-stone-700 hover:bg-stone-50 focus:bg-stone-50 focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <Icon className="w-4 h-4 text-stone-400" />
                {itemLabel}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
