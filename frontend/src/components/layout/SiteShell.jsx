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
  ];
  const COBALT_TREES = [ROUTES.CURRICULUM, ROUTES.STORE, ROUTES.AUDIENCES];
  const isCobaltPage =
    COBALT_PAGES.includes(pathname) ||
    COBALT_TREES.some((route) => pathname?.startsWith(route));

  return (
    <div
      id="school-master-shell"
      className={`min-h-screen flex flex-col justify-between antialiased ${
        isCobaltPage
          ? "bg-cn-paper text-cn-ink selection:bg-cn-paper-4 selection:text-cn-accent-3"
          : "cn-page-bg text-ink selection:bg-gold/25 selection:text-pine"
      }`}
    >
      <Navbar />
      <MobileMenu />
      <main id="primary-view-wrapper" className="flex-grow">
        <FeedbackBanner />
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
