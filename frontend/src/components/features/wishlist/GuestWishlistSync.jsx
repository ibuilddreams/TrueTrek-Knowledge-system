"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { WISHLIST_QUERY_KEY } from "@/hooks/useWishlist";
import { addToWishlist } from "@/services/wishlistService";
import { getGuestWishlistSnapshot, removeFromGuestWishlist } from "@/lib/guestWishlist";

// Mounted once at the app root. When a visitor who saved courses as a guest
// signs in as a student, move those courses into their server wishlist so
// nothing is lost across the sign-in step.
export default function GuestWishlistSync() {
  const queryClient = useQueryClient();
  const { isAuthenticated, isStudent } = useAuth();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !isStudent || isSyncingRef.current) return;
    const pending = getGuestWishlistSnapshot();
    if (pending.length === 0) return;

    isSyncingRef.current = true;
    (async () => {
      for (const course of pending) {
        try {
          await addToWishlist(course.id);
          removeFromGuestWishlist(course.id);
        } catch (error) {
          // A 4xx means it can't be saved (already saved or unpublished) so
          // drop it; a network/5xx failure keeps it for the next attempt.
          const status = error?.status;
          if (status && status < 500) removeFromGuestWishlist(course.id);
        }
      }
      await queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
      isSyncingRef.current = false;
    })();
  }, [isAuthenticated, isStudent, queryClient]);

  return null;
}
