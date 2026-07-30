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
  const rawRoleLabel = !label ? backendProfile?.role || undefined : undefined;
  const roleLabel =
    rawRoleLabel &&
    rawRoleLabel.trim().toLowerCase() !== displayLabel.trim().toLowerCase()
      ? rawRoleLabel
      : undefined;
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

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
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
    {
      key: "profile",
      label: "Profile",
      icon: User,
      onSelect: onProfile,
      disabled: false,
    },
    {
      key: "sign-out",
      label: isSigningOut ? "Signing Out..." : "Sign Out",
      icon: LogOut,
      onSelect: signOut,
      disabled: isSigningOut,
      danger: true,
    },
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
          "px-3.5 py-2.5 text-xs font-semibold font-mono rounded-xl tracking-wider transition-all duration-200 flex items-center gap-2 border shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed " +
          (isOpen
            ? isDark
              ? "bg-stone-800 border-stone-700 shadow-md"
              : "bg-white border-amber-200 ring-2 ring-amber-600/15"
            : isDark
              ? "bg-stone-850 hover:bg-stone-800 border-stone-800 hover:border-stone-700 hover:shadow-md"
              : "bg-stone-50 hover:bg-white border-stone-200 hover:border-stone-300")
        }
        title="Open account menu"
        aria-label="Open account menu"
      >
        <span
          className={
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 " +
            (isDark
              ? "bg-stone-900 text-amber-500 border border-stone-700 shadow-inner"
              : "bg-amber-50 text-amber-700 border border-amber-100")
          }
        >
          <User className="w-3.5 h-3.5" />
        </span>
        <span className="flex flex-col items-start leading-tight text-left min-w-0 gap-0.5">
          <span
            className={`font-semibold truncate max-w-36 ${
              isDark ? "text-stone-100" : "text-stone-800"
            }`}
          >
            {displayLabel}
          </span>
          {roleLabel && (
            <span className={`text-[10px] font-normal tracking-normal normal-case truncate max-w-36 ${
              isDark ? "text-stone-500" : "text-stone-400"
            }`}>
              {roleLabel}
            </span>
          )}
        </span>
        <span className={`w-px h-6 shrink-0 ${isDark ? "bg-stone-700" : "bg-stone-200"}`} />
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-labelledby="account-menu-trigger"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-[100]"
          >
            <div className="px-3.5 py-2 border-b border-stone-100 mb-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-semibold">
                Account
              </p>
              <p className="text-xs font-semibold text-stone-800 truncate mt-0.5">
                {displayLabel}
              </p>
            </div>
            {menuItems.map(
              (
                { key, label: itemLabel, icon: Icon, onSelect, disabled, danger },
                index
              ) => (
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
                  onKeyDown={(event) =>
                    handleItemKeyDown(event, index, menuItems.length)
                  }
                  className={
                    "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold font-mono focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent " +
                    (danger
                      ? "text-rose-700 hover:bg-rose-50 focus:bg-rose-50"
                      : "text-stone-700 hover:bg-stone-50 focus:bg-stone-50")
                  }
                >
                  <Icon
                    className={`w-4 h-4 ${
                      danger ? "text-rose-500" : "text-stone-400"
                    }`}
                  />
                  {itemLabel}
                </button>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
