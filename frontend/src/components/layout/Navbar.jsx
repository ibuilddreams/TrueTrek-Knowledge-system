"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Sun, Moon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleMobileMenu } from "@/store/slices/ui/uiSlice";
import { NAV_LINKS } from "@/constants/navigation";
import { ROUTES, getSectionFromPathname } from "@/constants/routes";
import { useTheme } from "@/hooks/useTheme";

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state) => state.ui.mobileMenuOpen);
  const { theme, toggleTheme, isVault } = useTheme();
  const activeSection = getSectionFromPathname(pathname);

  const linkClass = (key) =>
    `hover:text-amber-500 transition-colors ${
      activeSection === key ? "text-amber-500 font-bold" : "text-stone-500"
    }`;

  return (
    <nav
      id="master-nav"
      className={`backdrop-blur-md border-b fixed w-full z-50 top-0 h-20 flex items-center px-6 md:px-10 justify-between transition-colors duration-300 ${
        isVault
          ? "bg-[#161412]/90 border-stone-800"
          : "bg-white/90 border-stone-200/80"
      }`}
    >
      <Link
        id="logo-combo"
        href={ROUTES.HOME}
        className="flex items-center gap-3 cursor-pointer select-none group"
        title="Return to TrueTrek Learning home orientation page"
        aria-label="Return to TrueTrek Learning home orientation page"
      >
        <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-800 rounded-lg flex items-center justify-center text-white font-serif font-extrabold text-xl shadow-md">
          TTL
        </div>
        <h1
          className={`text-xl md:text-2xl font-serif font-black tracking-wide transition-colors duration-250 ${
            isVault
              ? "text-[#f5f5f4] group-hover:text-amber-500"
              : "text-stone-900 group-hover:text-amber-800"
          }`}
        >
          TrueTrek Learning<span className="text-amber-700 font-sans">.</span>
        </h1>
      </Link>

      <div
        id="desktop-nav-links"
        className="hidden md:flex gap-8 font-mono text-xs tracking-wider capitalize font-semibold"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.id}
            id={link.id}
            href={link.href}
            className={linkClass(link.key)}
            title={link.title}
            aria-label={link.title}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div id="nav-cta-segment" className="flex items-center gap-3">
        <button
          id="theme-toggle-btn"
          type="button"
          onClick={toggleTheme}
          className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-300 ${
            isVault
              ? "bg-stone-800 border-stone-700 text-amber-500 hover:bg-stone-700 hover:border-amber-500/50 hover:text-amber-400 shadow-md"
              : "bg-stone-50 border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
          }`}
          title={isVault ? "Switch to Light Mode" : "Activate Vault Dark Mode"}
          aria-label={
            isVault ? "Switch to Light Mode" : "Activate Vault Dark Mode"
          }
        >
          {isVault ? (
            <Sun className="w-4 h-4 text-amber-500 animate-[spin_10s_linear_infinite]" />
          ) : (
            <Moon className="w-4 h-4 text-stone-600" />
          )}
        </button>

        <Link
          id="nav-portal-login-btn"
          href={ROUTES.LOGIN}
          className={`font-mono text-xs uppercase tracking-wider px-6 py-2.5 rounded-full font-bold transition duration-250 shadow-sm flex items-center gap-2 select-none ${
            isVault
              ? "bg-amber-600 hover:bg-amber-500 text-stone-950"
              : "bg-stone-900 hover:bg-stone-800 text-stone-100"
          }`}
          title="Access the secure Student Portal simulator with interactive drills"
          aria-label="Access the secure Student Portal simulator with interactive drills"
        >
          <User className="w-3.5 h-3.5" />
          Portal Access
        </Link>

        <button
          id="mobile-menu-trigger"
          type="button"
          onClick={() => dispatch(toggleMobileMenu())}
          className={`md:hidden w-10 h-10 flex items-center justify-center border rounded-full transition ${
            isVault
              ? "border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white"
              : "border-stone-200 text-stone-600 hover:text-stone-950 hover:bg-stone-50"
          }`}
          title="Toggle mobile navigation menu"
          aria-label="Toggle mobile navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="font-sans font-semibold text-xs">☰</span>
        </button>
      </div>
    </nav>
  );
}
