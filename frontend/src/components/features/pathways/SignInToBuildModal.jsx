"use client";

import { useRouter } from "next/navigation";
import { Wand2 } from "lucide-react";
import SignInModal from "@/components/features/auth/SignInModal";
import { ROUTES } from "@/constants/routes";

// Shown when a guest taps "Build your own pathway" on /pathways.
//
// It is the design's sign-in dialog (`features/auth/SignInModal`) — the same
// one the store's "Enroll now" and the pathway price prompt open — so a visitor
// signs in on the spot instead of being sent to /login and losing what they
// were doing. /pathways is on the cobalt system, and the porcelain/serif dialog
// this used to render read as a different product the moment it opened.
//
// `nextPath` is both the `?next=` carried into the sign-up route and where an
// in-place sign-in lands: the dialog promises the builder, so it delivers the
// builder. It deliberately does **not** re-check the role here — the account
// may not have settled into the store by the time this fires, and
// `CustomPathwayBuilder` already turns away both a signed-out visitor and an
// account that is not a student, with the right message for each.
export default function SignInToBuildModal({
  isOpen,
  onClose,
  nextPath = ROUTES.PATHWAY_BUILDER,
}) {
  const router = useRouter();

  return (
    <SignInModal
      isOpen={isOpen}
      onClose={onClose}
      nextPath={nextPath}
      context={{
        icon: Wand2,
        eyebrow: "Sign in to build",
        title: "Your own pathway",
      }}
      onSignedIn={() => {
        onClose();
        router.push(nextPath);
      }}
    />
  );
}
