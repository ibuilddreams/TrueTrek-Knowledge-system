"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleMobileMenu } from "@/store/slices/ui/uiSlice";
import { NAV_LINKS } from "@/constants/navigation";
import { ROUTES, getSectionFromPathname } from "@/constants/routes";

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state) => state.ui.mobileMenuOpen);
  const activeSection = getSectionFromPathname(pathname);

  const linkClass = (key) =>
    `min-h-[34px] inline-flex items-center px-3 rounded-xl transition-colors duration-200 ${
      activeSection === key
        ? "text-ink bg-paper/90 shadow-[inset_0_0_0_1px_rgba(22,33,29,0.06)]"
        : "text-ink/60 hover:text-ink hover:bg-paper/60"
    }`;

  return (
    <nav
      id="master-nav"
      className="sticky top-[18px] z-50 mx-auto w-[min(1100px,calc(100%-32px))] mt-[18px] flex items-center gap-3 p-2 justify-between rounded-nav border border-white/78 bg-paper/58 backdrop-blur-2xl shadow-soft transition-colors duration-300"
    >
      <Link
        id="logo-combo"
        href={ROUTES.HOME}
        className="inline-flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl bg-white/42 cursor-pointer select-none group"
        title="Return to TrueTrek Learning home orientation page"
        aria-label="Return to TrueTrek Learning home orientation page"
      >
        <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-pine to-moss flex items-center justify-center text-paper font-serif font-light text-[11px] shadow-soft">
          TT
        </div>
        <span className="text-sm font-sans font-bold tracking-tight text-ink group-hover:text-pine transition-colors duration-200">
          TrueTrek Learning<span className="text-gold">.</span>
        </span>
      </Link>

      <div
        id="desktop-nav-links"
        className="hidden md:flex items-center gap-0.5 p-1 rounded-2xl bg-white/40 border border-ink/6 font-sans text-[13px] font-semibold capitalize"
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

      <div id="nav-cta-segment" className="flex items-center gap-2">
        <Link
          id="nav-portal-login-btn"
          href={ROUTES.LOGIN}
          className="font-sans text-[13px] px-3.5 min-h-10 rounded-[14px] font-extrabold transition duration-200 shadow-[0_12px_26px_rgba(22,33,29,0.17)] hover:-translate-y-0.5 flex items-center gap-2 select-none bg-ink hover:bg-pine text-white"
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
          className="md:hidden w-10 h-10 flex items-center justify-center border border-line rounded-full text-muted hover:text-ink hover:bg-porcelain transition"
          title="Toggle mobile navigation menu"
          aria-label="Toggle mobile navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className="font-sans font-semibold text-sm">☰</span>
        </button>
      </div>
    </nav>
  );
}
