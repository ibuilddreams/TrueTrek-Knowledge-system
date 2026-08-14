"use client";

import { useState } from "react";
import { AlertCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthField from "@/components/ui/AuthField";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import GoogleSignInButton from "@/components/features/auth/GoogleSignInButton";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

// Public onboarding intentionally doesn't ask visitors to pick a username —
// the real login is by email (CustomTokenObtainPairSerializer.username_field
// = "email" on the backend), so `username` is only an internal, never-shown
// identifier. Derive one from the email's local part with a random suffix so
// a uniqueness collision (backend enforces case-insensitive uniqueness)
// doesn't surface a confusing "username taken" error to someone who never
// entered one.
function generateUsername(email) {
  const base =
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_.-]/g, "") || "user";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export default function SignupStep({ onContinue }) {
  const { signup } = useAuth();
  const { isVault } = useTheme();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    gender: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function handleGoogleSuccess({ user }) {
    toastSuccess(`Welcome, ${user.name || user.email}. Let's find your pathway.`);
    onContinue();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const { user } = await signup({
        username: generateUsername(form.email.trim()),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender,
      });
      toastSuccess(`Welcome, ${user.name || user.email}. Let's find your pathway.`);
      onContinue();
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to create your account. Please try again."
      );
      setFormError(message);
      toastError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectClassName = `w-full p-3 rounded-lg border text-xs font-mono focus:outline-none transition ${
    isVault
      ? "bg-[#0c0b0a] border-stone-700 focus:border-amber-600"
      : "bg-white border-stone-200 focus:border-amber-600"
  } ${
    form.gender
      ? isVault
        ? "text-stone-200"
        : "text-stone-800"
      : isVault
        ? "text-stone-600"
        : "text-stone-400"
  }`;

  return (
    <AuthGateCard
      icon={UserPlus}
      title="Create Your Account"
      subtitle="Start your TrueTrek Learning journey — sign up to get a personalized course pathway."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3.5">
          <AuthField
            id="input-onboarding-first-name"
            label="First Name"
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={updateField("firstName")}
          />
          <AuthField
            id="input-onboarding-last-name"
            label="Last Name"
            required
            autoComplete="family-name"
            value={form.lastName}
            onChange={updateField("lastName")}
          />
        </div>

        <AuthField
          id="input-onboarding-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={updateField("email")}
        />

        <AuthField
          id="input-onboarding-password"
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={updateField("password")}
          showPasswordToggle
        />

        <div>
          <label
            htmlFor="input-onboarding-gender"
            className={`text-[10px] font-mono block uppercase tracking-wider mb-1.5 ${
              isVault ? "text-stone-500" : "text-stone-400"
            }`}
          >
            Gender
          </label>
          <select
            id="input-onboarding-gender"
            required
            value={form.gender}
            onChange={updateField("gender")}
            className={selectClassName}
          >
            <option value="" disabled>
              Select gender
            </option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {formError && (
          <div
            className={`p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-mono ${
              isVault
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-red-50 border border-red-100 text-red-600"
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <AuthSubmitButton
          id="submit-onboarding-signup-btn"
          label="Create Account & Continue"
          loadingLabel="Creating Account..."
          isSubmitting={isSubmitting}
          icon={UserPlus}
        />

        <div className="relative flex items-center py-1">
          <div className={`flex-1 h-px ${isVault ? "bg-stone-800" : "bg-stone-200"}`} />
          <span
            className={`px-3 text-[10px] font-mono uppercase tracking-wider ${
              isVault ? "text-stone-600" : "text-stone-400"
            }`}
          >
            Or
          </span>
          <div className={`flex-1 h-px ${isVault ? "bg-stone-800" : "bg-stone-200"}`} />
        </div>

        <GoogleSignInButton onSuccess={handleGoogleSuccess} disabled={isSubmitting} />
      </form>
    </AuthGateCard>
  );
}
