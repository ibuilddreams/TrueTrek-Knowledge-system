"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { User, ChevronDown, LogOut, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLogoutFlow } from "@/hooks/useLogoutFlow";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessagesCount";
import { getProfile } from "@/services/profileService";

const FALLBACK_LABEL = "My account";
const MENU_WIDTH = 240;  // the design's `.pop.menu`
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
  const accountEmail = backendProfile?.email || user?.email || "";
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
      label: "Profile & settings",
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
      label: isSigningOut ? "Signing out..." : "Sign out",
      icon: LogOut,
      onSelect: signOut,
      disabled: isSigningOut,
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
          className="z-40 max-w-[calc(100vw-2rem)] rounded-[14px] border border-cn-p-line bg-cn-p-card p-2 font-sans shadow-cn-p"
        >
          <div className="flex items-center gap-3 p-3">
            <span className="grid h-10 w-10 flex-none place-items-center overflow-hidden rounded-full bg-cn-p-soft text-[13px] font-bold text-cn-p-soft-ink">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-[18px] w-[18px]" />
              )}
            </span>
            <span className="grid min-w-0">
              <b className="truncate text-sm text-cn-p-ink">{displayLabel}</b>
              {accountEmail && (
                <span className="truncate text-xs text-cn-p-ink-2">{accountEmail}</span>
              )}
            </span>
          </div>
          {menuItems.map(
            (
              { key, label: itemLabel, icon: Icon, onSelect, disabled, badge },
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
                className="flex w-full items-center gap-3 rounded-cn-p-sm p-3 text-left text-sm text-cn-p-ink transition-colors duration-150 hover:bg-cn-p-page focus:bg-cn-p-page focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
              >
                <Icon className="h-[18px] w-[18px] flex-none text-cn-p-ink-2" />
                <span className="flex-1 text-left">{itemLabel}</span>
                {badge ? (
                  <span
                    className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-cn-p-accent px-1 text-[10px] font-bold text-white"
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
          `w-full px-3.5 py-2.5 ${size === "lg" ? "text-sm" : "text-xs"} font-semibold font-sans rounded-xl tracking-wide transition-all duration-200 flex items-center gap-2 border shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cn-p-accent focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ` +
          (isOpen
            ? isDark
              ? "bg-white/10 border-white/15 shadow-md"
              : "bg-white border-cn-p-accent-soft ring-2 ring-cn-p-soft"
            : isDark
              ? "bg-cn-p-ink/40 hover:bg-cn-p-ink/60 border-white/10 hover:border-white/20 hover:shadow-md"
              : "bg-cn-p-page hover:bg-white border-cn-p-line hover:border-cn-p-accent-soft")
        }
        title="Open account menu"
        aria-label="Open account menu"
      >
        <span
          className={
            "w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0 " +
            (isDark
              ? "bg-cn-p-ink/60 text-cn-p-soft-ink border border-white/15 shadow-inner"
              : "bg-cn-p-soft text-cn-p-soft-ink border border-cn-p-soft")
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
 isDark ? "text-white" : "text-cn-p-ink"
 }`}
          >
            {displayLabel}
          </span>
          {roleLabel && (
            <span
              className={`${size === "lg" ? "text-[11px]" : "text-[10px]"} font-normal tracking-normal normal-case truncate max-w-36 ${
 isDark ? "text-white/60" : "text-cn-p-ink-2"
 }`}
            >
              {roleLabel}
            </span>
          )}
        </span>
        <span
          className={`w-px h-6 shrink-0 ${isDark ? "bg-white/15" : "bg-cn-p-line"}`}
        />
        <ChevronDown
          className={`w-3.5 h-3.5 text-cn-p-ink-2 transition-transform duration-200 shrink-0 ${
 isOpen ? "rotate-180" : ""
 }`}
        />
      </button>

      {mounted ? createPortal(menuContent, document.body) : null}
    </div>
  );
}
