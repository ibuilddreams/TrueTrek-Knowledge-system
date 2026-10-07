"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getPortalRouteForRole, ROUTES } from "@/constants/routes";
import { checkoutPathways, getMyPathways } from "@/services/pathwaysService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastInfo, toastSuccess } from "@/lib/toast";

// One source of truth for "what can this viewer do with this pathway", shared
// by the hero CTA and the sticky bar so the two can never disagree. Reuses the
// store's checkout call, and keeps purchasing student-only exactly as
// PathwaysStore does.
export function usePathwayPurchase(pathway) {
  const queryClient = useQueryClient();
  const { status, isAuthenticated, isStudent, role } = useAuth();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  const isAuthResolved = status !== "idle" && status !== "loading";

  const myPathwaysQuery = useQuery({
    queryKey: ["my-pathways"],
    queryFn: async () => (await getMyPathways())?.data || [],
    enabled: isAuthenticated && isStudent,
  });

  const isOwned = (myPathwaysQuery.data || []).some(
    (enrollment) => enrollment.pathway?.id === pathway.id,
  );

  const checkoutMutation = useMutation({
    mutationFn: () => checkoutPathways([pathway.id]),
    onSuccess: (response) => {
      const result = response?.data || {};
      if ((result.enrolled_pathways || []).length > 0) {
        toastSuccess("Payment successful — your pathway is unlocked!");
      } else if ((result.already_enrolled_pathways || []).length > 0) {
        toastInfo("You already have access to this pathway.");
      }
      (result.failed_pathways || []).forEach((item) =>
        toastError(`${pathway.name}: ${item.reason}`),
      );

      setIsCheckoutOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-pathways"] });
      queryClient.invalidateQueries({ queryKey: ["studentEnrollments"] });
      queryClient.invalidateQueries({ queryKey: ["studentDashboard"] });
    },
    onError: (error) =>
      toastError(getApiErrorMessage(error, "Checkout failed. Please try again.")),
  });

  let mode = "buy";
  if (!isAuthResolved || (isAuthenticated && isStudent && myPathwaysQuery.isLoading)) {
    mode = "loading";
  } else if (isAuthenticated && !isStudent) {
    mode = "staff";
  } else if (isOwned) {
    mode = "owned";
  } else if (!isAuthenticated) {
    mode = "guest";
  }

  const COPY = {
    loading: { label: "Loading…", note: null },
    staff: { label: "Open your portal", note: "Pathways are purchasable from student accounts." },
    owned: { label: "Start learning", note: "You already own this pathway." },
    guest: { label: "Sign in to enroll", note: "Student accounts can enroll in this pathway." },
    buy: { label: "Enroll in this pathway", note: "One payment unlocks every course below." },
  };

  // Where a CTA should link, when the action is a navigation rather than a
  // checkout. `null` means the CTA runs `act()` instead.
  const href =
    mode === "staff"
      ? getPortalRouteForRole(role)
      : mode === "owned"
        ? `${ROUTES.STUDENT_PORTAL}?tab=courses`
        : null;

  function act() {
    // Guests get the sign-in prompt rather than an abrupt redirect; it carries
    // `?next=` so they return to this pathway once signed in.
    if (mode === "guest") {
      setIsSignInOpen(true);
      return;
    }
    if (mode === "buy") setIsCheckoutOpen(true);
  }

  return {
    mode,
    isOwned,
    href,
    act,
    label: COPY[mode].label,
    note: COPY[mode].note,
    isDisabled: mode === "loading",
    isSignInOpen,
    closeSignIn: () => setIsSignInOpen(false),
    isCheckoutOpen,
    closeCheckout: () => setIsCheckoutOpen(false),
    confirmCheckout: () => checkoutMutation.mutate(),
    isSubmitting: checkoutMutation.isPending,
  };
}
