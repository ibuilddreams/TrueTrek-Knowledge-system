"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleMobileMenu } from "@/store/slices/ui/uiSlice";
import { NAV_LINKS } from "@/constants/navigation";
import {
  ROUTES,
  getPortalRouteForRole,
  getSectionFromPathname,
} from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const mobileMenuOpen = useSelector((state) => state.ui.mobileMenuOpen);
  const activeSection = getSectionFromPathname(pathname);

  // The one nav action: "Log in" for a visitor, and the way back into their
  // own portal once they are signed in — the destination depends on the role,
  // so it is resolved rather than hard-coded to the student portal.
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

  // The bar is borderless over the top of a page and grows a rule plus a
  // shadow once the page has moved under it — the design's one piece of
  // nav state, and the only thing that separates it from the hero.
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = (key) =>
    `block rounded-cn-sm px-3 py-2 text-cn-sm transition-colors duration-150 ${
      activeSection === key
        ? "font-semibold text-cn-accent"
        : "font-medium text-cn-ink-2 hover:bg-cn-paper-2 hover:text-cn-ink"
    }`;

  return (
    <nav
      id="master-nav"
      className={`sticky top-0 z-50 border-b backdrop-blur-[14px] backdrop-saturate-150 transition-[border-color,box-shadow] duration-200 ease-cn-out ${
        isScrolled
          ? "border-cn-rule bg-white/85 shadow-[0_8px_24px_-18px_rgba(17,24,39,0.35)]"
          : "border-transparent bg-white/80"
      }`}
    >
      <div className="cn-container flex h-[var(--cn-nav-h)] items-center gap-6">
        <Link
          id="logo-combo"
          href={ROUTES.HOME}
          className="inline-flex shrink-0 items-center rounded-cn-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent"
          title="Return to Cool Nerdz home orientation page"
          aria-label="Return to Cool Nerdz home orientation page"
        >
          {/* The design's wordmark, sized the way it sizes it: a fixed
              150px width with the height following the 480x115 artwork, not a
              fixed height. It steps down one notch below `sm`, where the cart,
              wishlist and menu buttons share the bar with it. */}
          <img
            src="/images/coolnerdz-wordmark.png"
            alt="Cool Nerdz"
            width={480}
            height={115}
            className="h-auto w-[132px] object-contain sm:w-[150px]"
          />
        </Link>

        <ul
          id="desktop-nav-links"
          className="ml-auto hidden list-none items-center gap-1 p-0 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <Link
                id={link.id}
                href={link.href}
                className={linkClass(link.key)}
                title={link.title}
                aria-label={link.title}
                aria-current={activeSection === link.key ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div
          id="nav-cta-segment"
          className="ml-auto flex items-center gap-1 lg:ml-2"
        >
          {/* The design's `.navapply`: a quiet text link beside the one filled
              action, and hidden at the width where the bar collapses — the
              mobile menu carries it instead. Guests only: there is nothing to
              apply for once you have an account. */}
          {!isAuthenticated && (
            <Link
              id="nav-apply-link"
              href={ROUTES.SIGNUP}
              className="ml-2 hidden rounded-cn-sm px-3 py-2 text-cn-sm font-semibold text-cn-ink no-underline transition-colors duration-150 hover:bg-cn-paper-2 lg:block"
              title="Apply for a Cool Nerdz account"
            >
              Apply
            </Link>
          )}

          <Link
            id="nav-portal-login-btn"
            href={action.href}
            className="ml-1 hidden h-11 items-center gap-2 rounded-cn-sm bg-cn-accent px-4 text-cn-sm font-semibold text-white transition-[background-color,transform] duration-150 ease-cn-out select-none hover:-translate-y-px hover:bg-cn-accent-2 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cn-accent active:translate-y-px sm:inline-flex"
            title={action.title}
          >
            {action.label}
          </Link>

          <button
            id="mobile-menu-trigger"
            type="button"
            onClick={() => dispatch(toggleMobileMenu())}
            className="grid h-11 w-11 place-items-center rounded-cn-sm text-cn-ink transition-colors duration-150 hover:bg-cn-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent lg:hidden"
            title="Toggle mobile navigation menu"
            aria-label="Toggle mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-[22px] w-[22px]" strokeWidth={1.9} />
          </button>
        </div>
      </div>
    </nav>
  );
}
