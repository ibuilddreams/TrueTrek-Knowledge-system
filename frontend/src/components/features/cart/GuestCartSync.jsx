"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { CART_QUERY_KEY } from "@/hooks/useCart";
import { addToCart } from "@/services/cartService";
import {
  getGuestCartSnapshot,
  removeFromGuestCart,
} from "@/lib/guestCart";

// Mounted once at the app root. When a visitor who built a guest cart signs
// in as a student, move those courses into their server cart so nothing is
// lost across the sign-in step.
export default function GuestCartSync() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isStudent } = useAuth();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !isStudent || isSyncingRef.current) return;
    const pending = getGuestCartSnapshot();
    if (pending.length === 0) return;

    isSyncingRef.current = true;
    (async () => {
      for (const course of pending) {
        try {
          await addToCart(course.id);
          removeFromGuestCart(course.id);
        } catch (error) {
          // A 4xx means the course can't be carted (e.g. already enrolled or
          // unpublished) so drop it; a network/5xx failure keeps it for the
          // next attempt.
          const status = error?.status;
          if (status && status < 500) removeFromGuestCart(course.id);
        }
      }
      await queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      isSyncingRef.current = false;
    })();
  }, [isAuthenticated, isStudent, queryClient]);

  return null;
}
