"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FOOTER_LINKS, GOVERNANCE_BADGES } from "@/constants/navigation";

export default function Footer() {
  return (
    <footer
      id="master-footer"
      className="bg-pine text-sage/80 py-16 px-6 border-t border-white/10"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-white/10 pb-12 mb-10">
          <div className="space-y-4 md:col-span-1.5 col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-ink font-serif font-light text-sm">
                TT
              </div>
              <h4 className="font-serif font-light text-lg text-paper">
                TrueTrek Learning LLC
              </h4>
            </div>
            <p className="text-sm text-sage/70 font-light leading-relaxed max-w-sm">
              Licensing the world&apos;s leading high-performance administrative
              software covenants. We deploy regulatory, legal, and
              neurobiological support systems to selectively elite partners.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-sm uppercase font-sans font-medium tracking-widest text-gold">
              Incubator Core
            </h5>
            <ul className="space-y-1.5 text-sm text-left">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className={`hover:text-gold ${
                      link.highlight ? "text-gold font-semibold" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-sm uppercase font-sans font-medium tracking-widest text-gold">
              Governance & Auditing
            </h5>
            <ul className="space-y-1.5 text-sm">
              {GOVERNANCE_BADGES.map((badge) => (
                <li
                  key={badge}
                  className="flex items-center gap-1.5 text-sage/70"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-sage/60 font-sans">
          <p>
            &copy; {new Date().getFullYear()} TrueTrek Learning LLC. All rights
            or covenants reserved. Developed with Google AI Studio.
          </p>
          <div className="flex gap-4">
            <span className="text-sage/60">TERMS OF COMPLIANCE</span>
            <span className="text-sage/60">PRIVACY COVENANTS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
