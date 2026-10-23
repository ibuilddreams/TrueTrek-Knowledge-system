"use client";

import { Lock } from "lucide-react";
import styles from "./PathwayCard.module.css";
import { formatCoursePrice } from "@/lib/store";
import { usePathwayPricing } from "@/hooks/usePathwayPricing";

// The bundle price in a pathway card's footer, in its three states: the price
// itself, the locked chip a guest gets instead, and a neutral placeholder
// while the session is still being restored.
//
// Shared by PathwayCard (the /pathways store) and AudiencePathwayCard (the
// audience pages) — both render inside PathwayCard.module.css, and a guest
// should be told the same thing wherever a pathway is shown.
export default function PathwayPriceTag({ price, onRequestSignIn }) {
  const { canSeePrice, isResolved } = usePathwayPricing();

  return (
    <>
      <span className={styles.priceLabel}>Bundle price</span>

      {!isResolved ? (
        <span aria-hidden="true" className={styles.pricePlaceholder} />
      ) : canSeePrice ? (
        <span className={styles.price}>{formatCoursePrice(price)}</span>
      ) : (
        // Carries its own stacking context in CSS so it sits above the card's
        // stretched link and opens the prompt rather than navigating.
        <button
          type="button"
          onClick={onRequestSignIn}
          className={styles.lockedPrice}
        >
          <Lock aria-hidden="true" className="h-3.5 w-3.5" />
          Sign in to view price
        </button>
      )}
    </>
  );
}
