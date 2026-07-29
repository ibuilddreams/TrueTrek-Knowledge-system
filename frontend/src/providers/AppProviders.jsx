"use client";

import ReduxProvider from "./ReduxProvider";
import AuthProvider from "./AuthProvider";
import QueryProvider from "./QueryProvider";
import Toaster from "@/components/ui/Toaster";

export default function AppProviders({ children }) {
  return (
    <QueryProvider>
      <ReduxProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </ReduxProvider>
    </QueryProvider>
  );
}
