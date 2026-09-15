"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { forgotPassword } from "@/services/authService";
import { useGuestOnlyRoute } from "@/hooks/useGuestOnlyRoute";
import { toastError } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthField from "@/components/ui/AuthField";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import Loader from "@/components/ui/Loader";

function validateEmail(email) {
  if (!email.trim()) {
    return "Email address is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid email address.";
  }
  return "";
}

export default function ForgotPasswordForm() {
  const { shouldBlock, isAuthenticated } = useGuestOnlyRoute();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (shouldBlock) {
    return (
      <Loader
        label={isAuthenticated ? "Redirecting to Portal..." : "Checking Session..."}
      />
    );
  }

  const handleChange = (event) => {
    setEmail(event.target.value);
    setEmailError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await forgotPassword({ email: email.trim() });
      setSuccessMessage(
        message ||
          "If an account exists with this email address, a password reset link has been sent."
      );
    } catch (error) {
      toastError(
        error?.message || "Unable to send the reset link. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGateCard
      icon={KeyRound}
      title="Forgot Password"
      subtitle="Enter your email address and we'll send you a link to reset your password."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="input-forgot-password-email"
          label="Email Address"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={handleChange}
          error={emailError}
        />

        {successMessage && (
          <div className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs bg-sage/40 border border-sage text-moss">
            <MailCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <AuthSubmitButton
          id="submit-forgot-password-btn"
          label="Send Reset Link"
          loadingLabel="Sending..."
          isSubmitting={isSubmitting}
        />

        <p className="text-center text-xs font-light text-muted">
          <Link
            href={ROUTES.LOGIN}
            className="font-semibold transition text-pine hover:text-moss"
          >
            Back to Sign In
          </Link>
        </p>
      </form>
    </AuthGateCard>
  );
}
