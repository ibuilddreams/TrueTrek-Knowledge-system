"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "./Navbar";
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

  return (
    <div
      id="school-master-shell"
      className="min-h-screen flex flex-col justify-between antialiased selection:bg-gold/25 selection:text-pine cn-page-bg text-ink"
    >
      <Navbar />
      <MobileMenu />
      <main id="primary-view-wrapper" className="flex-grow">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
