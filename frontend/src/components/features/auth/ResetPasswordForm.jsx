"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { resetPassword } from "@/services/authService";
import { useGuestOnlyRoute } from "@/hooks/useGuestOnlyRoute";
import { toastError, toastSuccess } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthField from "@/components/ui/AuthField";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import Loader from "@/components/ui/Loader";

function validateForm(form) {
  const errors = {};
  if (!form.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (form.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (form.newPassword && form.newPassword !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shouldBlock, isAuthenticated } = useGuestOnlyRoute();
  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (shouldBlock) {
    return (
      <Loader
        label={isAuthenticated ? "Redirecting to Portal..." : "Checking Session..."}
      />
    );
  }

  const handleFieldChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await resetPassword({
        uid,
        token,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });
      setIsSuccess(true);
      toastSuccess(message || "Your password has been reset successfully.");
      setTimeout(() => router.push(ROUTES.LOGIN), 1800);
    } catch (error) {
      toastError(
        error?.message || "Unable to reset your password. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!uid || !token) {
    return (
      <AuthGateCard
        icon={AlertCircle}
        title="Invalid Reset Link"
        subtitle="This password reset link is invalid or has expired."
      >
        <p className="text-center text-xs font-light text-muted">
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="font-semibold transition text-pine hover:text-moss"
          >
            Request a new reset link
          </Link>
        </p>
      </AuthGateCard>
    );
  }

  return (
    <AuthGateCard
      icon={KeyRound}
      title="Reset Password"
      subtitle="Choose a new password for your account."
    >
      {isSuccess ? (
        <div className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-medium bg-sage/40 border border-sage text-moss">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Your password has been reset successfully. Redirecting to Sign
            In&hellip;
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            id="input-reset-new-password"
            label="New Password"
            type="password"
            required
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleFieldChange("newPassword")}
            error={errors.newPassword}
            showPasswordToggle
          />

          <AuthField
            id="input-reset-confirm-password"
            label="Confirm New Password"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleFieldChange("confirmPassword")}
            error={errors.confirmPassword}
            showPasswordToggle
          />

          <AuthSubmitButton
            id="submit-reset-password-btn"
            label="Reset Password"
            loadingLabel="Resetting..."
            isSubmitting={isSubmitting}
          />
        </form>
      )}
    </AuthGateCard>
  );
}
