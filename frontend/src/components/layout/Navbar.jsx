"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleMobileMenu } from "@/store/slices/ui/uiSlice";
import { NAV_LINKS } from "@/constants/navigation";
import { ROUTES, getSectionFromPathname } from "@/constants/routes";
import CartNavButton from "./CartNavButton";
import WishlistNavButton from "./WishlistNavButton";

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state) => state.ui.mobileMenuOpen);
  const activeSection = getSectionFromPathname(pathname);

  const linkClass = (key) =>
    `min-h-[34px] inline-flex items-center px-3 rounded-xl transition-colors duration-200 ${
      activeSection === key
        ? "text-ink bg-white shadow-[inset_0_0_0_1px_rgba(22,33,29,0.12),0_1px_2px_rgba(22,33,29,0.06)]"
        : "text-ink/60 hover:text-ink hover:bg-ink/[0.04]"
    }`;

  return (
    <nav
      id="master-nav"
      className="sticky top-[18px] z-50 mx-auto w-[min(1100px,calc(100%-32px))] mt-[18px] flex items-center gap-3 p-2 justify-between rounded-nav border border-ink/8 bg-white shadow-soft transition-colors duration-300"
    >
      <Link
        id="logo-combo"
        href={ROUTES.HOME}
        className="inline-flex items-center px-1 py-0.5 rounded-2xl cursor-pointer select-none"
        title="Return to Cool Nerdz home orientation page"
        aria-label="Return to Cool Nerdz home orientation page"
      >
        <img
          src="/images/coolnerdz-logo.png"
          alt="Cool Nerdz"
          width={800}
          height={633}
          className="h-12 sm:h-14 lg:h-16 w-auto object-contain"
        />
      </Link>

      <div
        id="desktop-nav-links"
        className="hidden md:flex items-center gap-0.5 p-1 rounded-2xl bg-white border border-ink/8 font-sans text-[13px] font-semibold capitalize"
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
        <WishlistNavButton />
        <CartNavButton />

        <Link
          id="nav-portal-login-btn"
          href={ROUTES.LOGIN}
          className="font-sans text-[13px] px-3.5 min-h-10 rounded-[14px] font-extrabold transition duration-200 shadow-[0_12px_26px_rgba(22,33,29,0.17)] hover:-translate-y-0.5 flex items-center gap-2 select-none bg-ink hover:bg-pine text-white"
          title="Access the secure Cool Nerdz Portal simulator with interactive drills"
          aria-label="Access the secure Cool Nerdz Portal simulator with interactive drills"
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
