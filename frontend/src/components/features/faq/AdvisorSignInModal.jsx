"use client";

import { MessageCircleQuestion } from "lucide-react";
import SignInModal from "@/components/features/auth/SignInModal";
import { ROUTES } from "@/constants/routes";

// Shown when a signed-out visitor taps "Ask an Advisor" on /faq.
//
// It is the design's sign-in dialog (`features/auth/SignInModal`), the same one
// the store, the pathway prompts and the bundle builder open. /faq is on the
// cobalt system; the porcelain/serif dialog this used to render was doubly odd
// here, because its *body* had already been converted to cobalt tokens while
// the frame around it had not.
//
// Signing in finishes the thing they were trying to do rather than dropping
// them somewhere to start again: `onSignedIn` hands back to
// `ContactAdvisorEntry`, which opens the question box. `nextPath` only governs
// the sign-*up* detour, which leaves the page, so it returns them here.
export default function AdvisorSignInModal({ isOpen, onClose, onSignedIn }) {
  return (
    <SignInModal
      isOpen={isOpen}
      onClose={onClose}
      nextPath={ROUTES.FAQ}
      context={{
        icon: MessageCircleQuestion,
        eyebrow: "Sign in to continue",
        title: "Ask an Advisor",
      }}
      onSignedIn={onSignedIn}
    />
  );
}
