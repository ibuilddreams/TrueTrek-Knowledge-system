"use client";

import { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestOnlyRoute } from "@/hooks/useGuestOnlyRoute";
import { useNextPath } from "@/hooks/useNextPath";
import { buildAuthUrl } from "@/lib/authRedirect";
import { ROUTES } from "@/constants/routes";
import { toastError } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import GoogleSignInButton from "@/components/features/auth/GoogleSignInButton";
import AuthArtPanel from "@/components/features/auth/AuthArtPanel";

const FIELD =
  "h-[50px] w-full rounded-cn-sm border border-cn-muted bg-white px-4 text-cn-ink transition-colors duration-150 hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent";
const LABEL = "text-cn-sm font-semibold text-cn-ink";


export default function LoginForm() {
  const { login } = useAuth();
  const { shouldBlock, isAuthenticated } = useGuestOnlyRoute();
  const nextPath = useNextPath();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
  function celebrateSignIn() {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#2450e6", "#879ff1", "#0f2580"],
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      celebrateSignIn();
    } catch (error) {
      const message = error?.message || "Unable to sign in. Please try again.";
      setFormError(message);
      toastError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="pt-6">
      <div className="cn-container grid min-h-[calc(100svh-var(--cn-nav-h)-48px)] gap-10 lg:grid-cols-2">
        {/* The art panel. Below `lg` it becomes a short banner above the
            form and drops its bullet list, as the design does — the
            photograph is atmosphere, and a phone should reach the fields
            without scrolling past a full-height image. */}
        <AuthArtPanel className="min-h-[280px] rounded-cn-lg lg:min-h-[560px]" />

        <div className="grid place-items-center py-10">
          <div className="grid w-[min(440px,100%)] gap-6">
            <div>
              <h1 className="text-cn-3xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
                Log in to Cool Nerdz.
              </h1>
              <p className="mt-3 text-cn-ink-2">
                Students, parents, coaches, teachers and admins all sign in
                here.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-6">
              <div className="grid gap-1">
                <label htmlFor="input-login-email" className={LABEL}>
                  Email
                </label>
                <input
                  id="input-login-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={FIELD}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="grid gap-1">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="input-login-password" className={LABEL}>
                    Password
                  </label>
                  <Link
                    href={ROUTES.FORGOT_PASSWORD}
                    className="text-cn-sm font-semibold text-cn-accent no-underline hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="input-login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    className={`${FIELD} pr-[72px]`}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-1.5 h-[38px] -translate-y-1/2 rounded-cn-sm px-3 text-cn-sm font-semibold text-cn-ink-2 transition-colors duration-150 hover:bg-cn-paper-2"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="flex items-start gap-2.5 rounded-cn-sm bg-[#fdecec] px-4 py-3 text-cn-sm text-[#b91c1c]"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </p>
              )}

              <button
                id="submit-login-btn"
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 disabled:opacity-70"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && <ArrowRight className="h-[18px] w-[18px]" />}
              </button>

              <GoogleSignInButton
                onSuccess={celebrateSignIn}
                disabled={isSubmitting}
              />
            </form>

            {/* The design's rule-with-a-label: the text sits left and one line
                runs out from it to the edge. */}
            <div className="flex items-center gap-3 text-cn-sm text-cn-muted after:h-px after:flex-1 after:bg-cn-rule after:content-['']">
              <span>New to Cool Nerdz?</span>
            </div>

            <div className="grid gap-4 rounded-cn-lg border border-cn-rule bg-cn-paper-2 p-6">
              <div>
                <b>Apply for an account</b>
                <p className="mt-1 text-cn-sm text-cn-ink-2">
                  Three short steps. An advisor reviews it and places you in a
                  pathway, usually within one business day.
                </p>
              </div>
              <Link
                href={buildAuthUrl(ROUTES.SIGNUP, nextPath)}
                className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink no-underline shadow-cn-1 transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink"
              >
                Start your application
                <ArrowRight className="h-[18px] w-[18px]" />
              </Link>
            </div>

            <p className="text-center text-cn-sm text-cn-muted">
              Signing up a whole school?{" "}
              <Link
                href={ROUTES.PARTNERSHIPS}
                className="font-semibold text-cn-accent no-underline hover:underline"
              >
                See school licensing
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
