"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, ChevronDown, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLogoutFlow } from "@/hooks/useLogoutFlow";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { getProfile } from "@/services/profileService";

const FALLBACK_LABEL = "My Account";
const MENU_WIDTH = 208;
const NAVBAR_HEIGHT = 80;

function getFirstName(name) {
  const firstWord = name?.trim().split(/\s+/)[0];
  return firstWord || FALLBACK_LABEL;
}

export default function AccountMenu({
  label,
  onProfile,
  onMessages,
  variant = "light",
  className = "",
  size = "base",
}) {
  const isDark = variant === "dark";
  const { user } = useAuth();
  const { isSigningOut, signOut } = useLogoutFlow();
  const unreadConversations = useUnreadMessagesCount();
  const [backendProfile, setBackendProfile] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const avatarUrl = backendProfile?.profile?.avatar || null;
  const displayLabel =
    label || getFirstName(backendProfile?.full_name || user?.name);
  const rawRoleLabel = !label ? backendProfile?.role || undefined : undefined;
  const roleLabel =
    rawRoleLabel &&
    rawRoleLabel.trim().toLowerCase() !== displayLabel.trim().toLowerCase()
      ? rawRoleLabel
      : undefined;

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    if (rect.bottom <= NAVBAR_HEIGHT || rect.top >= window.innerHeight) {
      setIsOpen(false);
      return;
    }

    const viewportWidth = window.innerWidth;
    const gap = 8;
    const left = Math.min(
      Math.max(16, rect.right - MENU_WIDTH),
      viewportWidth - MENU_WIDTH - 16
    );

    setMenuPosition({
      top: Math.max(rect.bottom + gap, NAVBAR_HEIGHT + gap),
      left,
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      const inTrigger = containerRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inTrigger && !inMenu) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleScroll = () => {
      setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleScroll);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleScroll);
      window.removeEventListener("scroll", handleScroll, true);
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
      key: "messages",
      label: "Messages",
      icon: MessageSquare,
      onSelect: onMessages,
      disabled: false,
      badge: unreadConversations > 0 ? unreadConversations : null,
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

  const menuContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          role="menu"
          aria-labelledby="account-menu-trigger"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            width: MENU_WIDTH,
          }}
          className="max-w-[calc(100vw-2rem)] font-sans border rounded-xl shadow-elevated py-1.5 z-40 bg-paper border-line"
        >
          <div className="px-3.5 py-2 mb-1 border-b border-line">
            <p
              className={`${size === "lg" ? "text-[11px]" : "text-[10px]"} uppercase tracking-widest text-muted font-semibold`}
            >
              Account
            </p>
            <p
              className={`${size === "lg" ? "text-sm" : "text-xs"} font-semibold truncate mt-0.5 text-ink`}
            >
              {displayLabel}
            </p>
          </div>
          {menuItems.map(
            (
              { key, label: itemLabel, icon: Icon, onSelect, disabled, danger, badge },
              index
            ) => (
              <button
                key={key}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
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
                  `w-full flex items-center gap-2.5 px-3.5 py-2.5 ${size === "lg" ? "text-sm" : "text-xs"} font-semibold focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent ` +
                  (danger
                    ? "text-rose-700 hover:bg-rose-50 focus:bg-rose-50"
                    : "text-ink hover:bg-porcelain focus:bg-porcelain")
                }
              >
                <Icon
                  className={`w-4 h-4 ${danger ? "text-rose-500" : "text-muted"}`}
                />
                <span className="flex-1 text-left">{itemLabel}</span>
                {badge ? (
                  <span
                    className={`min-w-4.5 h-4.5 px-1 rounded-full bg-gold text-ink ${size === "lg" ? "text-[10px]" : "text-[9px]"} font-bold font-sans flex items-center justify-center shrink-0`}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            )
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className} ${isOpen ? "z-40" : "z-20"}`}
    >
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
          `w-full px-3.5 py-2.5 ${size === "lg" ? "text-sm" : "text-xs"} font-semibold font-sans rounded-xl tracking-wide transition-all duration-200 flex items-center gap-2 border shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-pine focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ` +
          (isOpen
            ? isDark
              ? "bg-white/10 border-white/15 shadow-md"
              : "bg-white border-pine/25 ring-2 ring-pine/15"
            : isDark
              ? "bg-ink/40 hover:bg-ink/60 border-white/10 hover:border-white/20 hover:shadow-md"
              : "bg-porcelain hover:bg-white border-line hover:border-pine/25")
        }
        title="Open account menu"
        aria-label="Open account menu"
      >
        <span
          className={
            "w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 " +
            (isDark
              ? "bg-ink/60 text-gold border border-white/15 shadow-inner"
              : "bg-gold/15 text-[#8a6f2e] border border-gold/25")
          }
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-3.5 h-3.5" />
          )}
        </span>
        <span className="flex flex-col items-start leading-tight text-left min-w-0 gap-0.5">
          <span
            className={`font-semibold truncate max-w-36 ${
              isDark ? "text-paper" : "text-ink"
            }`}
          >
            {displayLabel}
          </span>
          {roleLabel && (
            <span
              className={`${size === "lg" ? "text-[11px]" : "text-[10px]"} font-normal tracking-normal normal-case truncate max-w-36 ${
                isDark ? "text-sage/60" : "text-muted"
              }`}
            >
              {roleLabel}
            </span>
          )}
        </span>
        <span
          className={`w-px h-6 shrink-0 ${isDark ? "bg-white/15" : "bg-line"}`}
        />
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {mounted ? createPortal(menuContent, document.body) : null}
    </div>
  );
}
