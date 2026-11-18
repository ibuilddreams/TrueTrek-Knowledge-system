"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { setMobileMenuOpen } from "@/store/slices/ui/uiSlice";
import { NAV_LINKS } from "@/constants/navigation";
import {
  ROUTES,
  getPortalRouteForRole,
  getSectionFromPathname,
} from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

export default function MobileMenu() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state) => state.ui.mobileMenuOpen);
  const activeSection = getSectionFromPathname(pathname);

  // Mirrors the desktop bar's single action, so the two can never offer a
  // signed-in visitor different destinations.
  const { isAuthenticated, role } = useAuth();
  const action = isAuthenticated
    ? {
        href: getPortalRouteForRole(role),
        label: "My portal",
        title: "Go to your Cool Nerdz portal",
      }
    : {
        href: ROUTES.LOGIN,
        label: "Log in",
        title: "Log in to your Cool Nerdz account",
      };

  const closeMenu = () => dispatch(setMobileMenuOpen(false));

  return (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          id="mobile-menu-drawer"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          // Sits directly under the bar, which is why it reads the same
          // height token the bar itself is sized from.
          className="fixed top-[var(--cn-nav-h)] left-0 z-40 flex w-full flex-col border-b border-cn-rule bg-white shadow-cn-2 lg:hidden"
        >
          <div className="cn-container flex flex-col py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.id}
                id={`mobile-${link.id}`}
                href={link.href}
                onClick={closeMenu}
                className={`rounded-cn-sm px-3 py-3 text-cn-base transition-colors duration-150 ${
                  activeSection === link.key
                    ? "font-semibold text-cn-accent"
                    : "font-medium text-cn-ink-2 hover:bg-cn-paper-2 hover:text-cn-ink"
                }`}
                title={link.title}
                aria-label={link.title}
                aria-current={activeSection === link.key ? "page" : undefined}
              >
                {link.mobileLabel}
              </Link>
            ))}

            {/* The design keeps Apply out of the collapsed bar and lists it
                here instead, beside the sign-in action. Guests only. */}
            {!isAuthenticated && (
              <Link
                id="mobile-nav-apply-link"
                href={ROUTES.SIGNUP}
                onClick={closeMenu}
                className="rounded-cn-sm px-3 py-3 text-cn-base font-medium text-cn-ink-2 transition-colors duration-150 hover:bg-cn-paper-2 hover:text-cn-ink"
                title="Apply for a Cool Nerdz account"
              >
                Apply
              </Link>
            )}

            <Link
              id="mobile-nav-link-portal"
              href={action.href}
              onClick={closeMenu}
              className="mt-3 inline-flex h-[50px] w-full items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-sm font-semibold text-white transition-colors duration-150 hover:bg-cn-accent-2"
              title={action.title}
            >
              {action.label}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
