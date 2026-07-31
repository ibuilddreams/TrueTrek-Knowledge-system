"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import { toastError, toastSuccess } from "@/lib/toast";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthField from "@/components/ui/AuthField";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import Loader from "@/components/ui/Loader";

export default function LoginForm() {
  const router = useRouter();
  const { login, status, isAuthenticated, role } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(getPortalRouteForRole(role));
    }
  }, [isAuthenticated, role, router]);

  const isSessionPending =
    status === "idle" || status === "loading" || status === "authenticated";

  if (isSessionPending && !isSubmitting) {
    return (
      <Loader
        label={
          status === "authenticated" ? "Redirecting..." : "Checking Session..."
        }
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const { user } = await login({ email, password });
      toastSuccess(`Welcome back, ${user.name || user.email}.`);
      router.push(getPortalRouteForRole(user.role));
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
              className="text-[11px] font-mono font-semibold text-stone-500 hover:text-amber-800 uppercase tracking-wider transition"
            >
              Forgot Password?
            </Link>
          </div>
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
        />
      </form>
    </AuthGateCard>
  );
}
