"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { setMobileMenuOpen } from "@/store/slices/ui/uiSlice";
import { NAV_LINKS } from "@/constants/navigation";
import { ROUTES, getSectionFromPathname } from "@/constants/routes";
import { useTheme } from "@/hooks/useTheme";

export default function MobileMenu() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state) => state.ui.mobileMenuOpen);
  const { theme, toggleTheme, isVault } = useTheme();
  const activeSection = getSectionFromPathname(pathname);

  const closeMenu = () => dispatch(setMobileMenuOpen(false));

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          id="mobile-menu-drawer"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`md:hidden fixed top-20 left-0 w-full border-b z-40 p-6 flex flex-col gap-4 font-mono text-sm font-bold uppercase transition-colors duration-300 ${
            isVault
              ? "bg-[#161412] border-stone-800 text-stone-300"
              : "bg-white border-stone-200 text-stone-500"
          }`}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.id}
              id={`mobile-${link.id}`}
              href={link.href}
              onClick={closeMenu}
              className={`text-left py-3 border-b border-stone-100/10 ${
                activeSection === link.key ? "text-amber-500" : "text-stone-500"
              }`}
              title={link.title}
              aria-label={link.title}
            >
              {link.mobileLabel}
            </Link>
          ))}

          <div className="flex items-center justify-between py-3 border-b border-stone-100/10">
            <span className={isVault ? "text-stone-400" : "text-stone-500"}>
              Vault Mode
            </span>
            <button
              id="mobile-theme-toggle"
              type="button"
              onClick={toggleTheme}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-mono tracking-wider transition duration-200 ${
                isVault
                  ? "bg-amber-950/40 border-amber-500/50 text-amber-500"
                  : "bg-stone-100 border-stone-300 text-stone-600"
              }`}
              title={
                isVault ? "Switch to Light Mode" : "Activate Vault Dark Mode"
              }
              aria-label={
                isVault ? "Switch to Light Mode" : "Activate Vault Dark Mode"
              }
            >
              {isVault ? "ACTIVE" : "DEACTIVATED"}
            </button>
          </div>

          <Link
            id="mobile-nav-link-portal"
            href={ROUTES.LOGIN}
            onClick={closeMenu}
            className={`w-full text-center py-3.5 rounded-xl mt-3 ${
              isVault
                ? "bg-amber-600 text-stone-950 font-bold"
                : "bg-stone-900 text-white font-bold"
            }`}
            title="Access the secure Student Portal simulator with interactive drills"
            aria-label="Access the secure Student Portal simulator with interactive drills"
          >
            Access Simulated Vault
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
