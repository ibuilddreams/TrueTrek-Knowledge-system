"use client";

import { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { AlertCircle, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestOnlyRoute } from "@/hooks/useGuestOnlyRoute";
import { ROUTES } from "@/constants/routes";
import { toastError, toastSuccess } from "@/lib/toast";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthField from "@/components/ui/AuthField";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import Loader from "@/components/ui/Loader";
import GoogleSignInButton from "@/components/features/auth/GoogleSignInButton";

export default function LoginForm() {
  const { login } = useAuth();
  const { shouldBlock, isAuthenticated } = useGuestOnlyRoute();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (shouldBlock && !isSubmitting) {
    return (
      <Loader
        label={isAuthenticated ? "Redirecting..." : "Checking Session..."}
      />
    );
  }

  // Navigation itself is NOT done here — useGuestOnlyRoute (above) reacts to
  // isAuthenticated flipping true and sends the user to /onboarding or their
  // portal, whichever is correct. Doing it here too would race that check.
  function celebrateSignIn(user) {
    // toastSuccess(`Welcome back, ${user.name || user.email}.`); // disabled: clashes visually with the confetti animation
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#c7a85b", "#d96f5f", "#092d29"],
    });
  }

  function handleGoogleSuccess({ user }) {
    celebrateSignIn(user);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const { user } = await login({ email, password });
      celebrateSignIn(user);
    } catch (error) {
      const message = error?.message || "Unable to sign in. Please try again.";
      setFormError(message);
      toastError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGateCard
      icon={Lock}
      title="Sign In"
      subtitle="Enter your credentials to access your TrueTrek Learning account."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          id="input-login-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="space-y-2">
          <AuthField
            id="input-login-password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            showPasswordToggle
          />
          <div className="flex justify-end">
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-[11px] font-sans font-semibold uppercase tracking-widest transition text-pine hover:text-moss"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {formError && (
          <div className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-sans uppercase tracking-widest font-medium bg-red-50 border border-red-100 text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <AuthSubmitButton
          id="submit-login-btn"
          label="Sign In"
          loadingLabel="Signing In..."
          isSubmitting={isSubmitting}
          icon={LogIn}
        />

        <div className="relative flex items-center py-1">
          <div className="flex-1 h-px bg-line" />
          <span className="px-3 text-[10px] font-sans uppercase tracking-widest font-medium text-muted">
            Or
          </span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} disabled={isSubmitting} />

        <p className="text-center text-xs font-light text-muted">
          New to TrueTrek?{" "}
          <Link
            href={ROUTES.SIGNUP}
            className="font-semibold transition text-pine hover:text-moss"
          >
            Create an Account
          </Link>
        </p>
      </form>
    </AuthGateCard>
  );
}
