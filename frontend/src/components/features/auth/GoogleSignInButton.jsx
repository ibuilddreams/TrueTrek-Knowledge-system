"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Renders Google's own branded "Sign in with Google" button via the Identity
// Services SDK (google.accounts.id.renderButton) rather than a custom-styled
// button — Google's ToS require using their rendered button/assets, not a
// look-alike. The credential it hands back is a signed ID token JWT, verified
// server-side in users/serializers.py::GoogleAuthSerializer.
export default function GoogleSignInButton({ onSuccess, disabled = false }) {
  const { loginGoogle } = useAuth();
  const containerRef = useRef(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleCredentialResponse = useCallback(
    async (response) => {
      setIsVerifying(true);
      try {
        const data = await loginGoogle(response.credential);
        onSuccess?.(data);
      } catch (error) {
        toastError(getApiErrorMessage(error, "Google sign-in failed. Please try again."));
      } finally {
        setIsVerifying(false);
      }
    },
    [loginGoogle, onSuccess]
  );

  // `onSuccess` (and therefore `handleCredentialResponse`) gets a new identity
  // on every parent re-render (e.g. each keystroke in LoginForm's fields).
  // Routing the GSI callback through this ref — instead of putting
  // `handleCredentialResponse` in the effect below — keeps `initialize()`/
  // `renderButton()` from re-running on every render, which is what was
  // triggering GSI's "initialize() is called multiple times" warning.
  const handleCredentialResponseRef = useRef(handleCredentialResponse);
  handleCredentialResponseRef.current = handleCredentialResponse;

  useEffect(() => {
    if (!isScriptReady || !containerRef.current || !window.google?.accounts?.id) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => handleCredentialResponseRef.current(response),
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: Math.min(360, containerRef.current.offsetWidth || 320),
    });
  }, [isScriptReady]);

  // No client ID configured yet — keep the control visibly present (per the
  // Calm/Headspace-style onboarding requirement) but clearly inert, exactly
  // like before a real Google Cloud OAuth Client ID is provisioned.
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        type="button"
        disabled
        title="Google sign-in is not configured yet"
        className="w-full flex items-center justify-center gap-2 border border-line text-muted font-sans text-xs font-bold uppercase tracking-wider py-3.5 rounded-full cursor-not-allowed"
      >
        Continue with Google (Coming soon)
      </button>
    );
  }

  return (
    <div className="relative">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setIsScriptReady(true)}
      />
      <div ref={containerRef} className="flex justify-center" />
      {(isVerifying || disabled) && (
        <div className="absolute inset-0 bg-paper/70 rounded-xl flex items-center justify-center">
          {isVerifying && (
            <div className="w-4 h-4 border-2 border-pine border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
