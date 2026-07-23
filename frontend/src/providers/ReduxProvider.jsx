"use client";

import { useRef } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { getStoredBackendUser } from "@/services/authService";

function getPreloadedState() {
  if (typeof window === "undefined") return undefined;

  const user = getStoredBackendUser();
  if (!user) return undefined;

  return {
    auth: {
      status: "authenticated",
      isAuthenticated: true,
      user,
      error: null,
    },
  };
}

export default function ReduxProvider({ children }) {
  const storeRef = useRef(null);
  if (!storeRef.current) {
    storeRef.current = makeStore(getPreloadedState());
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
