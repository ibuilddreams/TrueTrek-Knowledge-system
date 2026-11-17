"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, BookOpen, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { buildAuthUrl } from "@/lib/authRedirect";
import { formatCoursePrice } from "@/lib/store";
import { toastError } from "@/lib/toast";
import AuthArtPanel from "@/components/features/auth/AuthArtPanel";

// The design's enrol modal: a visitor taps "Enroll now" on a store card and
// signs in right there, rather than being sent away to /login and losing the
// course they were looking at.
//
// It carries the course across the sign-in — the chip at the top says which
// one and what it costs — and hands it back through `onSignedIn` so the
// caller can finish the action the visitor actually asked for.
//
// There is deliberately no "keep me signed in" checkbox, which the design
// shows: this app's auth has no such option, and a checkbox that changes
// nothing is worse than none.
const FIELD =
  "h-[50px] w-full rounded-cn-sm border border-cn-muted bg-white px-4 text-cn-ink transition-colors duration-150 hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent";
const LABEL = "text-cn-sm font-semibold text-cn-ink";

export default function EnrollSignInModal({ isOpen, course, onClose, onSignedIn }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Each open starts clean: the previous visitor's typing, and any error from
  // it, must not be sitting there when the modal comes back.
  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setFormError("");
  }, [isOpen]);

  // Escape closes it, as it does for every other dialog here.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      onSignedIn?.(course);
    } catch (error) {
      const message = error?.message || "Unable to sign in. Please try again.";
      setFormError(message);
      toastError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // The course page is where they came from, so that is where signing up
  // should return them.
  const nextPath = course?.slug ? `${ROUTES.STORE}/${course.slug}` : ROUTES.STORE;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to enroll"
          onClick={onClose}
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-cn-ink/60 p-4 backdrop-blur-xs"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="relative my-auto grid w-full max-w-[920px] overflow-hidden rounded-cn-lg bg-white shadow-cn-3 lg:grid-cols-2"
          >
            <AuthArtPanel className="min-h-[560px] max-lg:hidden" />

            <div className="relative grid content-start gap-6 p-10">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-5 right-5 grid h-9 w-9 place-items-center rounded-cn-sm bg-cn-paper-2 text-cn-ink-2 transition-colors duration-150 hover:bg-cn-paper-3 hover:text-cn-ink"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="pr-10">
                <h2 className="text-cn-3xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
                  Log in to Cool Nerdz.
                </h2>
                <p className="mt-3 text-cn-ink-2">
                  Students, parents, coaches, teachers and admins all sign in
                  here.
                </p>
              </div>

              {course && (
                <div className="flex items-center gap-3 rounded-cn bg-cn-paper-3 p-4">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-cn-sm bg-white text-cn-accent">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <small className="block text-cn-sm font-semibold text-cn-accent-3">
                      Sign in to enroll
                    </small>
                    <b className="block truncate text-cn-ink">{course.title}</b>
                  </span>
                  <b className="flex-none tabular-nums text-cn-ink">
                    {formatCoursePrice(course.amount)}
                  </b>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid gap-1">
                  <label htmlFor="enroll-email" className={LABEL}>
                    Email
                  </label>
                  <input
                    id="enroll-email"
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
                    <label htmlFor="enroll-password" className={LABEL}>
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
                      id="enroll-password"
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
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 disabled:opacity-70"
                >
                  {isSubmitting ? "Signing in..." : "Sign in and continue"}
                  {!isSubmitting && <ArrowRight className="h-[18px] w-[18px]" />}
                </button>
              </form>

              <div className="flex items-center gap-3 text-cn-sm text-cn-muted before:h-px before:flex-1 before:bg-cn-rule before:content-[''] after:h-px after:flex-1 after:bg-cn-rule after:content-['']">
                <span>New to Cool Nerdz?</span>
              </div>

              <Link
                href={buildAuthUrl(ROUTES.SIGNUP, nextPath)}
                className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-cn-sm border border-cn-rule-strong bg-white px-6 text-cn-base font-semibold text-cn-ink no-underline shadow-cn-1 transition-[border-color,transform] duration-150 ease-cn-out hover:-translate-y-px hover:border-cn-ink"
              >
                Start your application
                <ArrowRight className="h-[18px] w-[18px]" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
