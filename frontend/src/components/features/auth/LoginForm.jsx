"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { toastError, toastSuccess } from "@/lib/toast";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthField from "@/components/ui/AuthField";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import Loader from "@/components/ui/Loader";

const ROLE_REDIRECTS = {
  [AUTH_ROLES.ADMIN]: ROUTES.DASHBOARD,
  [AUTH_ROLES.FACULTY]: ROUTES.DASHBOARD,
  [AUTH_ROLES.STUDENT]: ROUTES.PORTAL,
};

export default function LoginForm() {
  const router = useRouter();
  const { login, status, isAuthenticated, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(ROLE_REDIRECTS[role] || ROUTES.HOME);
    }
  }, [isAuthenticated, role, router]);

  if (status !== "anonymous" && !isSubmitting) {
    return <Loader label="Checking Session..." />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const { user } = await login({ email, password });
      toastSuccess(`Welcome back, ${user.name || user.email}.`);
      router.push(ROLE_REDIRECTS[user.role] || ROUTES.HOME);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="input-login-email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthField
          id="input-login-password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end -mt-2">
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="text-[11px] font-mono font-semibold text-stone-500 hover:text-amber-800 uppercase tracking-wider transition"
          >
            Forgot Password?
          </Link>
        </div>

        {formError && (
          <p className="text-[11px] text-red-600 font-mono">{formError}</p>
        )}

        <AuthSubmitButton
          id="submit-login-btn"
          label="Sign In"
          loadingLabel="Signing In..."
          isSubmitting={isSubmitting}
          icon={LogIn}
          className="disabled:opacity-50 flex items-center justify-center gap-2"
        />
      </form>
    </AuthGateCard>
  );
}
