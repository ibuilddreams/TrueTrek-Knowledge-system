"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./Navbar";
import FeedbackBanner from "@/components/features/feedback/FeedbackBanner";
import MobileMenu from "./MobileMenu";
import Footer from "./Footer";
import { ROUTES } from "@/constants/routes";
import { selectLogoutStage, setLogoutStage } from "@/store/slices/ui/uiSlice";
import LogoutOverlay from "@/components/ui/LogoutOverlay";

export default function SiteShell({ children }) {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const logoutStage = useSelector(selectLogoutStage);

  useEffect(() => {
    if (pathname === ROUTES.LOGIN && logoutStage !== "idle") {
      dispatch(setLogoutStage("idle"));
    }
  }, [pathname, logoutStage, dispatch]);

  if (logoutStage !== "idle") {
    return <LogoutOverlay stage={logoutStage} />;
  }

  const hideFooter = pathname?.startsWith(ROUTES.MESSAGES);

  // The signed-in portals bring their own frame — a sidebar and a sticky top
  // bar (`features/portal/shell/PortalShell`). They are rendered bare, with
  // no site navbar, mobile menu or footer over them, or the window would
  // carry two headers and the sidebar would start below the wrong one.
  const PORTAL_ROUTES = [
    ROUTES.STUDENT_PORTAL,
    ROUTES.TEACHER_PORTAL,
    ROUTES.ADMIN_PORTAL,
  ];
  const isPortalRoute = PORTAL_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`),
  );

  // These pages are on the cobalt design system (white paper, one cobalt
  // signal); every other public page still runs the porcelain recipe. The
  // shell owns the choice because the sticky, translucent navbar sits over
  // whatever this wrapper paints — were the two to disagree, the bar would
  // read as a cream band across the top of a white page.
  //
  // /curriculum, /store and /audiences are matched by prefix because their
  // detail pages are converted too; the rest are matched exactly, or an
  // unconverted sub-route would get a white background under porcelain
  // content.
  const COBALT_PAGES = [
    ROUTES.HOME,
    ROUTES.FAQ,
    ROUTES.PATHWAYS,
    ROUTES.TIERS,
    ROUTES.PARTNERSHIPS,
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    // The onboarding wizard is the screen /signup hands a new student to, and
    // it carries the same cobalt rail — were it left off this list the navbar
    // above it would stay porcelain over a white page.
    ROUTES.ONBOARDING,
  ];
  const COBALT_TREES = [
    ROUTES.CURRICULUM,
    ROUTES.STORE,
    ROUTES.AUDIENCES,
    // Covers /pathways and every pathway's own page.
    ROUTES.PATHWAYS,
  ];
  // Nothing is excepted any more: the custom-bundle builder, the last page
  // under /pathways still on porcelain, moved across on 2026-11-25. The list
  // stays because the next page to be converted will want it again.
  const COBALT_EXCEPTIONS = [];
  const isCobaltPage =
    !COBALT_EXCEPTIONS.some(
      (route) => pathname === route || pathname?.startsWith(`${route}/`),
    ) &&
    (COBALT_PAGES.includes(pathname) ||
      COBALT_TREES.some((route) => pathname?.startsWith(route)));

  return (
    <div
      id="school-master-shell"
      className={`min-h-screen flex flex-col justify-between antialiased ${
        isCobaltPage
          ? "bg-cn-paper text-cn-ink selection:bg-cn-paper-4 selection:text-cn-accent-3"
          : "cn-page-bg text-ink selection:bg-gold/25 selection:text-pine"
      }`}
    >
      {!isPortalRoute && <Navbar />}
      {!isPortalRoute && <MobileMenu />}
      <main id="primary-view-wrapper" className="flex-grow">
        {!isPortalRoute && <FeedbackBanner />}
        {children}
      </main>
      {!hideFooter && !isPortalRoute && <Footer />}
    </div>
  );
}
