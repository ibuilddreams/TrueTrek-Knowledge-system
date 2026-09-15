"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestOnlyRoute } from "@/hooks/useGuestOnlyRoute";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthField from "@/components/ui/AuthField";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import Loader from "@/components/ui/Loader";

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

// The backend requires `gender` on CustomUser (no default, enforced in
// CustomUserManager.create_user) even though this form never shows a
// username field — the real login is by email, so `username` is only an
// internal, never-shown identifier. Derive one from the email's local part
// with a random suffix so a uniqueness collision (backend enforces
// case-insensitive uniqueness) doesn't surface a confusing "username taken"
// error to someone who never entered one.
function generateUsername(email) {
  const base =
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_.-]/g, "") || "user";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export default function SignupForm() {
  const { signup } = useAuth();
  const { shouldBlock, isAuthenticated } = useGuestOnlyRoute();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    gender: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (shouldBlock && !isSubmitting) {
    return (
      <Loader
        label={isAuthenticated ? "Redirecting..." : "Checking Session..."}
      />
    );
  }

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  // Navigation itself is NOT done here — useGuestOnlyRoute (above) reacts to
  // isAuthenticated flipping true and sends the new student straight into
  // /onboarding (they land on the Questionnaire step, since signup already
  // logs them in). Doing it here too would race that check.
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

  const selectClassName = `w-full p-3 rounded-xl border text-xs font-sans focus:outline-none transition bg-paper border-line focus:border-pine ${
    form.gender ? "text-ink" : "text-muted"
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
            id="input-signup-first-name"
            label="First Name"
            required
            autoComplete="given-name"
            value={form.firstName}
            onChange={updateField("firstName")}
          />
          <AuthField
            id="input-signup-last-name"
            label="Last Name"
            required
            autoComplete="family-name"
            value={form.lastName}
            onChange={updateField("lastName")}
          />
        </div>

        <AuthField
          id="input-signup-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={updateField("email")}
        />

        <AuthField
          id="input-signup-password"
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
            htmlFor="input-signup-gender"
            className="text-[10px] font-sans block uppercase tracking-widest font-medium mb-1.5 text-muted"
          >
            Gender
          </label>
          <select
            id="input-signup-gender"
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
          <div className="p-3.5 rounded-xl flex items-start gap-2.5 text-xs font-sans uppercase tracking-widest font-medium bg-red-50 border border-red-100 text-red-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <AuthSubmitButton
          id="submit-signup-btn"
          label="Create Account"
          loadingLabel="Creating Account..."
          isSubmitting={isSubmitting}
          icon={UserPlus}
        />

        <p className="text-center text-xs font-light text-muted">
          Already have an account?{" "}
          <Link
            href={ROUTES.LOGIN}
            className="font-semibold transition text-pine hover:text-moss"
          >
            Sign In
          </Link>
        </p>
      </form>
    </AuthGateCard>
  );
}
