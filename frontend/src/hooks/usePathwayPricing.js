"use client";

import { useAuth } from "@/hooks/useAuth";

// Bundle pricing is shown to signed-in accounts only — a guest gets a locked
// chip that opens the sign-in prompt instead of a number. One hook so every
// pathway surface (the store grid, the audience grids, the pathway page and
// the homepage teaser) agrees on who sees a price.
//
// `isResolved` matters as much as the answer: the session is restored after
// first paint, so without it a signed-in visitor would watch the locked chip
// flash before their price arrives. Same guard usePathwayPurchase applies to
// its CTA.
export function usePathwayPricing() {
  const { status, isAuthenticated } = useAuth();

  const isResolved = status !== "idle" && status !== "loading";

  return { isResolved, canSeePrice: isResolved && isAuthenticated };
}
