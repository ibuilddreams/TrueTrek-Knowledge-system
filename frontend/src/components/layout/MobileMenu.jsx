"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { setMobileMenuOpen } from "@/store/slices/ui/uiSlice";
import { NAV_LINKS } from "@/constants/navigation";
import { ROUTES, getSectionFromPathname } from "@/constants/routes";

export default function MobileMenu() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state) => state.ui.mobileMenuOpen);
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
          className="md:hidden fixed top-24 left-0 w-full border-b z-40 p-6 flex flex-col gap-4 font-sans text-sm font-medium uppercase tracking-wide transition-colors duration-300 bg-paper border-line text-muted"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.id}
              id={`mobile-${link.id}`}
              href={link.href}
              onClick={closeMenu}
              className={`text-left py-3 border-b border-line ${
                activeSection === link.key ? "text-gold" : "text-muted"
              }`}
              title={link.title}
              aria-label={link.title}
            >
              {link.mobileLabel}
            </Link>
          ))}

          <Link
            id="mobile-nav-link-portal"
            href={ROUTES.LOGIN}
            onClick={closeMenu}
            className="w-full text-center py-3.5 rounded-full mt-3 bg-pine text-paper font-semibold"
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
