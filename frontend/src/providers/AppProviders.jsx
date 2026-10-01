"use client";

import ReduxProvider from "./ReduxProvider";
import AuthProvider from "./AuthProvider";
import QueryProvider from "./QueryProvider";
import Toaster from "@/components/ui/Toaster";
import GuestCartSync from "@/components/features/cart/GuestCartSync";

export default function AppProviders({ children }) {
  return (
    <QueryProvider>
      <ReduxProvider>
        <AuthProvider>
          <GuestCartSync />
          {children}
          <Toaster />
        </AuthProvider>
      </ReduxProvider>
    </QueryProvider>
  );
}
