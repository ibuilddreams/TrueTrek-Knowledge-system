"use client";

import { useSelector } from "react-redux";
import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";
import Footer from "./Footer";
import { useTheme } from "@/hooks/useTheme";
import { selectLogoutStage } from "@/store/slices/ui/uiSlice";
import LogoutOverlay from "@/components/ui/LogoutOverlay";

export default function SiteShell({ children }) {
  const { isVault } = useTheme();
  const logoutStage = useSelector(selectLogoutStage);

  return (
    <div
      id="school-master-shell"
      className={`min-h-screen flex flex-col justify-between antialiased selection:bg-amber-600/20 selection:text-amber-950 transition-colors duration-300 ${
        isVault
          ? "vault-dark bg-[#0c0b0a] text-stone-200"
          : "bg-[#faf9f6] text-stone-900"
      }`}
    >
      <Navbar />
      <MobileMenu />
      <main id="primary-view-wrapper" className="flex-grow pt-20">
        {children}
      </main>
      <Footer />
      <LogoutOverlay stage={logoutStage} />
    </div>
  );
}
