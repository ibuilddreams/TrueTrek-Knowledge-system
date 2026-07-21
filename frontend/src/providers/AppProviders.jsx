"use client";

import ReduxProvider from "./ReduxProvider";
import AuthProvider from "./AuthProvider";
import Toaster from "@/components/ui/Toaster";

export default function AppProviders({ children }) {
  return (
    <ReduxProvider>
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ReduxProvider>
  );
}
