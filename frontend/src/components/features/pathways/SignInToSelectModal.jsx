"use client";

import { ShieldCheck, Tag } from "lucide-react";
import SignInModal from "@/components/features/auth/SignInModal";
import { ROUTES } from "@/constants/routes";

// Shown when a guest tries to select or enroll in a pathway, or taps a bundle
// price that is only shown to signed-in accounts.
//
// It is the design's sign-in dialog (`features/auth/SignInModal`), the same one
// the store's "Enroll now" opens, so a visitor signs in on the spot instead of
// being sent to /login and losing the pathway they were reading about. The
// price they tapped is simply there when the dialog closes — `usePathwayPricing`
// reads the session — which is why signing in here needs no follow-up action.
//
// `nextPath` is carried as `?next=` on the "Start your application" route only:
// signing in happens in place, so only the sign-*up* detour has to find its way
// back. `intent` changes the chip and nothing else — both routes end in the
// same account, so a guest who clicked a withheld price isn't told they tried
// to buy something.
export default function SignInToSelectModal({
  isOpen,
  onClose,
  pathwayName,
  nextPath = ROUTES.PATHWAYS,
  intent = "select",
}) {
  const isPriceIntent = intent === "price";

  return (
    <SignInModal
      isOpen={isOpen}
      onClose={onClose}
      nextPath={nextPath}
      context={
        pathwayName && {
          icon: isPriceIntent ? Tag : ShieldCheck,
          eyebrow: isPriceIntent
            ? "Sign in to view pricing"
            : "Sign in to enroll",
          title: pathwayName,
          // No trailing value: the bundle price is exactly what is being
          // withheld, so there is nothing to show beside the name.
        }
      }
      onSignedIn={onClose}
    />
  );
}
