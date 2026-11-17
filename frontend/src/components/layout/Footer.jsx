"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { FOOTER_LINKS, GOVERNANCE_BADGES } from "@/constants/navigation";

export default function Footer() {
  return (
    <footer
      id="master-footer"
      className="bg-cn-ink pt-24 pb-10 text-cn-on-ink-2"
    >
      <div className="cn-container">
        {/* The mast: the name and what it is on the left, the two link
            columns on the right, over one rule. */}
        <div className="grid grid-cols-1 gap-10 border-b border-cn-ink-line pb-16 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-6">
            {/* The design ships a second, white wordmark for exactly this
                spot and sets it 200px wide. It sits straight on the dark
                field — the white panel that used to be here existed only to
                give the dark wordmark something to read against. */}
            <img
              src="/images/coolnerdz-wordmark-white.png"
              alt="Cool Nerdz"
              width={480}
              height={115}
              className="h-auto w-[200px] object-contain"
            />
            <p className="mt-4 max-w-[46ch] text-cn-base text-cn-on-ink-2">
              Licensing the world&apos;s leading high-performance administrative
              software covenants. We deploy regulatory, legal, and
              neurobiological support systems to selectively elite partners.
            </p>
          </div>

          <div className="md:col-span-3">
            <h3 className="mb-4 text-cn-base leading-[1.2] font-bold tracking-[-0.015em] text-cn-on-ink">
              Incubator Core
            </h3>
            <ul className="grid list-none gap-2 p-0 text-left">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className={`text-cn-sm no-underline transition-colors duration-150 hover:text-cn-on-ink hover:underline ${
                      link.highlight
                        ? "font-semibold text-cn-accent-soft"
                        : "text-cn-on-ink-2"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="mb-4 text-cn-base leading-[1.2] font-bold tracking-[-0.015em] text-cn-on-ink">
              Governance &amp; Auditing
            </h3>
            <ul className="grid list-none gap-2 p-0">
              {GOVERNANCE_BADGES.map((badge) => (
                <li
                  key={badge}
                  className="flex items-center gap-2 text-cn-sm text-cn-on-ink-2"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 text-cn-accent-soft" />
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-cn-sm">
          <p className="text-cn-on-ink-2">
            &copy; {new Date().getFullYear()} Cool Nerdz. All rights or
            covenants reserved. Developed with Google AI Studio.
          </p>
          <nav aria-label="Legal" className="flex gap-6">
            <span className="text-cn-on-ink-2">TERMS OF COMPLIANCE</span>
            <span className="text-cn-on-ink-2">PRIVACY COVENANTS</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
