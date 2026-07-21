"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FOOTER_LINKS, GOVERNANCE_BADGES } from "@/constants/navigation";

export default function Footer() {
  return (
    <footer
      id="master-footer"
      className="bg-stone-955 text-stone-400 py-16 px-6 border-t border-stone-850 bg-[#141211]"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-stone-850 pb-12 mb-10">
          <div className="space-y-4 md:col-span-1.5 col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                TTL
              </div>
              <h4 className="font-serif text-lg text-stone-200 font-semibold">
                TrueTrek Learning LLC
              </h4>
            </div>
            <p className="text-xs text-stone-400 font-light leading-relaxed max-w-sm">
              Licensing the world&apos;s leading high-performance administrative
              software covenants. We deploy regulatory, legal, and
              neurobiological support systems to selectively elite partners.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs uppercase font-mono tracking-widest text-[#faece1]">
              Incubator Core
            </h5>
            <ul className="space-y-1.5 text-xs text-left">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className={`hover:text-amber-500 ${
                      link.highlight ? "text-amber-500 font-bold" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="text-xs uppercase font-mono tracking-widest text-[#faece1]">
              Governance & Auditing
            </h5>
            <ul className="space-y-1.5 text-xs">
              {GOVERNANCE_BADGES.map((badge) => (
                <li
                  key={badge}
                  className="flex items-center gap-1.5 text-stone-405"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-stone-500 font-mono">
          <p>
            &copy; {new Date().getFullYear()} TrueTrek Learning LLC. All rights
            or covenants reserved. Developed with Google AI Studio.
          </p>
          <div className="flex gap-4">
            <span className="text-stone-500">TERMS OF COMPLIANCE</span>
            <span className="text-stone-500">PRIVACY COVENANTS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
