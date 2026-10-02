"use client";

import ReduxProvider from "./ReduxProvider";
import AuthProvider from "./AuthProvider";
import QueryProvider from "./QueryProvider";
import Toaster from "@/components/ui/Toaster";
import GuestCartSync from "@/components/features/cart/GuestCartSync";
import GuestWishlistSync from "@/components/features/wishlist/GuestWishlistSync";

export default function AppProviders({ children }) {
  return (
    <QueryProvider>
      <ReduxProvider>
        <AuthProvider>
          <GuestCartSync />
          <GuestWishlistSync />
          {children}
          <Toaster />
        </AuthProvider>
      </ReduxProvider>
    </QueryProvider>
  );
}
