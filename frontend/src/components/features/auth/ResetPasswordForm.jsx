"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { resetPassword } from "@/services/authService";
import { useGuestOnlyRoute } from "@/hooks/useGuestOnlyRoute";
import { toastError, toastSuccess } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import Loader from "@/components/ui/Loader";

function PasswordField({ id, label, value, onChange, show, onToggleShow, error, autoComplete }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          className={`w-full p-3 pr-11 rounded-lg border text-xs font-mono bg-stone-50 text-stone-800 focus:outline-none transition ${
            error
              ? "border-red-300 focus:border-red-500"
              : "border-stone-200 focus:border-amber-600"
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-350 hover:text-stone-600 transition"
          title={show ? "Hide password" : "Show password"}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && (
        <p className="text-[11px] text-red-600 font-mono mt-1.5">{error}</p>
      )}
    </div>
  );
}

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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        <p className="text-center text-xs text-stone-500 font-light">
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="font-semibold text-stone-700 hover:text-amber-800 transition"
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
        <p className="text-center text-xs text-emerald-700 font-medium">
          Your password has been reset successfully. Redirecting to Sign In...
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="input-reset-new-password"
            label="New Password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={handleFieldChange("newPassword")}
            show={showNewPassword}
            onToggleShow={() => setShowNewPassword((prev) => !prev)}
            error={errors.newPassword}
          />

          <PasswordField
            id="input-reset-confirm-password"
            label="Confirm New Password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleFieldChange("confirmPassword")}
            show={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
            error={errors.confirmPassword}
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
