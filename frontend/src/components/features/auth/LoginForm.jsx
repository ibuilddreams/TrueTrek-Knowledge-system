"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { toastError, toastSuccess } from "@/lib/toast";

const ROLE_REDIRECTS = {
  [AUTH_ROLES.ADMIN]: ROUTES.DASHBOARD,
  [AUTH_ROLES.FACULTY]: ROUTES.DASHBOARD,
  [AUTH_ROLES.STUDENT]: ROUTES.PORTAL,
};

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

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
    <div className="min-h-[80vh] flex items-center justify-center bg-[#faf9f6] py-16 px-6">
      <div className="w-full max-w-md bg-white border border-stone-200/85 p-8 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800"></div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-amber-600/10 text-amber-700 rounded-xl flex items-center justify-center mx-auto mb-4 border border-amber-200/40">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-serif text-stone-900 font-bold mb-1.5">
            Sign In
          </h2>
          <p className="text-stone-500 text-xs font-light">
            Enter your credentials to access your TrueTrek Learning account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              id="input-login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg border border-stone-200 text-xs font-mono bg-stone-50 text-stone-800 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-stone-400 block uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="input-login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-stone-200 text-xs font-mono bg-stone-50 text-stone-800 focus:outline-none focus:border-amber-600"
            />
          </div>

          {formError && (
            <p className="text-[11px] text-red-600 font-mono">{formError}</p>
          )}

          <button
            id="submit-login-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 px-4 rounded-lg text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
            <LogIn className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
