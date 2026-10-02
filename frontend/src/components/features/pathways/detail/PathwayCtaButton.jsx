"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, LogIn, Route } from "lucide-react";

const ICONS = {
  loading: null,
  staff: ArrowRight,
  owned: CheckCircle2,
  guest: LogIn,
  buy: Route,
};

// Renders the pathway's primary action from usePathwayPurchase state — a link
// when the action navigates, a button when it opens checkout.
export default function PathwayCtaButton({ purchase, className = "", id }) {
  const Icon = ICONS[purchase.mode];
  const content = (
    <>
      {Icon && <Icon className="h-4 w-4" />}
      {purchase.label}
    </>
  );

  if (purchase.href) {
    return (
      <Link id={id} href={purchase.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      id={id}
      type="button"
      onClick={purchase.act}
      disabled={purchase.isDisabled}
      className={className}
    >
      {content}
    </button>
  );
}
