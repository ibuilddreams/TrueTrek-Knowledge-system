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

// The design's enrol dialog (`.dlgbox.wide` > `.lgm` > `.lgart` + `.lgmbox`):
// a visitor taps "Enroll now" and signs in right there, rather than being sent
// to /login and losing the course they were looking at.
//
// Two things in here are load-bearing rather than cosmetic. The grid is
// `minmax(0,5fr) minmax(0,6fr)`, **not** `1fr 1fr`: a grid item's default
// `min-width: auto` refuses to shrink below its content, so a long course
// title in the chip pushed the whole right-hand column past the dialog's edge
// and clipped the form. `minmax(0,...)` plus `min-w-0` on the box and a
// truncating title are what hold it inside. And the dialog scrolls itself
// (`max-h` + `overflow-y-auto`), because at 960px wide and 64px of vertical
// padding it is taller than a laptop viewport.
//
// There is deliberately no "keep me signed in on this device" checkbox, which
// the design shows: this app's auth has no such option, and a checkbox that
// changes nothing is worse than none.
const FIELD =
  "h-[50px] w-full rounded-cn-sm border border-cn-muted bg-cn-paper px-4 text-cn-ink transition-[border-color] duration-[140ms] ease-cn-out hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent disabled:cursor-not-allowed disabled:opacity-50";
const LABEL = "text-cn-sm font-semibold text-cn-ink";
// `.lgbtn` — full width, 52px, and the design's `.btn` type size of 16px.
const BUTTON =
  "inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-cn-sm border border-transparent px-6 py-px text-cn-base font-semibold no-underline transition-[background-color,border-color,transform] duration-150 ease-cn-out focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cn-accent";

export default function EnrollSignInModal({ isOpen, course, onClose, onSignedIn }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // The design ships this ticked, and that matches what every other entry
  // point here already does, so leaving it alone changes nothing.
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Each open starts clean: the previous visitor's typing, and any error from
  // it, must not be sitting there when the modal comes back.
  useEffect(() => {
    if (!isOpen) return;
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setRemember(true);
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
      await login({ email, password, remember });
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
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to enroll"
          onClick={onClose}
          className="fixed inset-0 z-[600] grid place-items-center bg-cn-ink/50 p-6 backdrop-blur-[4px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="relative max-h-[calc(100vh-48px)] w-[min(960px,100%)] overflow-x-hidden overflow-y-auto rounded-cn-lg bg-cn-paper shadow-cn-3"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-[3] grid h-10 w-10 place-items-center rounded-cn-sm bg-cn-paper-2 text-cn-ink-2 transition-colors duration-150 hover:bg-cn-rule hover:text-cn-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cn-accent"
            >
              <X className="h-[18px] w-[18px]" />
            </button>

            <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] max-[48rem]:grid-cols-[minmax(0,1fr)]">
              <AuthArtPanel
                variant="modal"
                className="min-h-full rounded-none max-[48rem]:hidden"
              />

              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-center gap-4 px-10 py-16 max-[48rem]:px-6 max-[48rem]:py-10">
                <h2 className="pr-11 text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.025em] text-balance text-cn-ink">
                  Log in to Cool Nerdz.
                </h2>
                <p className="-mt-3 text-cn-ink-2">
                  Students, parents, coaches, teachers and admins all sign in
                  here.
                </p>

                {course && (
                  <div className="flex items-center gap-3 rounded-cn bg-cn-paper-3 px-4 py-3 text-cn-sm">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-cn-paper text-cn-accent">
                      <BookOpen className="h-[18px] w-[18px]" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <small className="block text-[12px] font-semibold text-cn-accent-3">
                        Sign in to enroll
                      </small>
                      <b className="block truncate">{course.title}</b>
                    </span>
                    <em className="flex-none font-bold not-italic tabular-nums">
                      {formatCoursePrice(course.amount)}
                    </em>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
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

                  <label className="flex cursor-pointer items-start gap-3 text-cn-sm text-cn-ink-2">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="m-0 h-5 w-5 accent-cn-accent"
                    />
                    <span>Keep me signed in on this device</span>
                  </label>

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
                    className={`${BUTTON} bg-cn-accent text-white shadow-cn-1 enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 disabled:opacity-70`}
                  >
                    {isSubmitting ? "Signing in..." : "Sign in and continue"}
                    {!isSubmitting && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.9} />}
                  </button>
                </form>

                {/* `.lgdiv` — the label sits in the middle with a rule running
                    out to each side. */}
                <div className="flex items-center gap-3 text-cn-sm text-cn-muted before:h-px before:flex-1 before:bg-cn-rule before:content-[''] after:h-px after:flex-1 after:bg-cn-rule after:content-['']">
                  <span>New to Cool Nerdz?</span>
                </div>

                <Link
                  href={buildAuthUrl(ROUTES.SIGNUP, nextPath)}
                  className={`${BUTTON} border-cn-rule-strong bg-cn-paper text-cn-ink shadow-cn-1 hover:-translate-y-px hover:border-cn-ink`}
                >
                  Start your application
                  <ArrowRight className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
