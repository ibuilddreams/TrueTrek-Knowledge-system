"use client";

import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";
import Footer from "./Footer";
import { useTheme } from "@/hooks/useTheme";

export default function SiteShell({ children }) {
  const { isVault } = useTheme();

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
    </div>
  );
}
