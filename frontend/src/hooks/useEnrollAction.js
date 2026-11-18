"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import EnrollSignInModal from "@/components/features/store/EnrollSignInModal";

// "Enroll now", wherever it is offered: the store grid, the course page's
// purchase card and the suggestions beside it.
//
// One action, two outcomes. A signed-in student goes to their portal with the
// course named in the URL — that is where the purchase happens. Anyone else
// signs in first, right there, and lands in the same place afterwards.
//
// The guest half cannot be a redirect to /login: `?next=` deliberately refuses
// portal paths (`lib/authRedirect.js`), so a visitor sent that way would arrive
// at their portal with the course forgotten. The modal keeps the course in hand
// across the sign-in, which is the whole reason it exists.
//
// It lives in a hook rather than in each caller because all three used to hold
// their own copy of this, and the store's was the only one that was right.
export function useEnrollAction() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // The course a signed-out visitor tried to enrol in. Kept after the modal
  // closes so its title doesn't vanish mid fade-out.
  const [course, setCourse] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  function openPortalCheckout(selected) {
    router.push(
      `${ROUTES.STUDENT_PORTAL}?buy=${encodeURIComponent(selected.slug)}`,
    );
  }

  function enroll(selected) {
    if (!selected?.slug) return;
    if (isAuthenticated) {
      openPortalCheckout(selected);
      return;
    }
    setCourse(selected);
    setIsOpen(true);
  }

  // Rendered by the caller, so the modal sits inside whatever already owns the
  // page's stacking context.
  const enrollModal = (
    <EnrollSignInModal
      isOpen={isOpen}
      course={course}
      onClose={() => setIsOpen(false)}
      onSignedIn={(selected) => {
        setIsOpen(false);
        if (selected) openPortalCheckout(selected);
      }}
    />
  );

  return { enroll, enrollModal };
}
