"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useGuestOnlyRoute } from "@/hooks/useGuestOnlyRoute";
import { useNextPath } from "@/hooks/useNextPath";
import { buildAuthUrl } from "@/lib/authRedirect";
import { ROUTES } from "@/constants/routes";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError, toastSuccess } from "@/lib/toast";
import Loader from "@/components/ui/Loader";

// Backend roles (users.CustomUser.Roles) — the signup endpoint accepts these
// two only, so ADMIN is deliberately absent here and rejected server-side too.
const SIGNUP_ROLES = {
  STUDENT: "STUDENT",
  TEACHER: "TEACHER",
};

const ROLE_OPTIONS = [
  {
    value: SIGNUP_ROLES.STUDENT,
    label: "Student",
    hint: "An athlete, scholar or founder",
  },
  {
    value: SIGNUP_ROLES.TEACHER,
    label: "Teacher",
    hint: "Faculty applying to teach",
  },
];

// The three steps the design's side rail lists. Only the first happens on this
// page: creating the account is what this form does, and the goals step is the
// onboarding wizard a new student is sent to the moment they are signed in
// (see `useGuestOnlyRoute`). The rail describes the real journey rather than
// promising two more screens that live here.
const JOURNEY = [
  { title: "Create your account", hint: "Name, email and who you are" },
  { title: "Your goals", hint: "Pathway and level, in the portal" },
  { title: "Start learning", hint: "Your first course is waiting" },
];

const FIELD =
  "h-[50px] w-full rounded-cn-sm border border-cn-muted bg-white px-4 text-cn-ink transition-colors duration-150 hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent";
const LABEL = "text-cn-sm font-semibold text-cn-ink";

// This form never shows a username field — the real login is by email, so
// `username` is only an internal, never-shown identifier. Derive one from the
// email's local part with a random suffix so a uniqueness collision (backend
// enforces case-insensitive uniqueness) doesn't surface a confusing "username
// taken" error to someone who never entered one.
function generateUsername(email) {
  const base =
    email.split("@")[0]?.toLowerCase().replace(/[^a-z0-9_.-]/g, "") || "user";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export default function SignupForm() {
  const { signup } = useAuth();
  const { shouldBlock, isAuthenticated } = useGuestOnlyRoute();
  const nextPath = useNextPath();
  const [form, setForm] = useState({
    role: SIGNUP_ROLES.STUDENT,
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  if (shouldBlock && !isSubmitting) {
    return (
      <Loader
        // This page is on the cobalt system, and so is the screen a signed-in
        // visitor is on their way to — without the tone the hand-off flashes a
        // cream page and a pine spinner under a cobalt navbar.
        tone="cobalt"
        label={isAuthenticated ? "Redirecting..." : "Checking Session..."}
      />
    );
  }

  const isTeacherSignup = form.role === SIGNUP_ROLES.TEACHER;

  function updateField(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  // Navigation itself is NOT done here — useGuestOnlyRoute (above) reacts to
  // isAuthenticated flipping true and routes by role: a new student goes to
  // /onboarding (landing on the Questionnaire step, since signup already logs
  // them in) and a new teacher straight to their portal, pathways being a
  // student-only concept. Doing it here too would race that check.
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
        role: form.role,
      });
      toastSuccess(
        isTeacherSignup
          ? `Welcome, ${user.name || user.email}. Let's get your teaching application started.`
          : `Welcome, ${user.name || user.email}. Let's find your pathway.`,
      );
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to create your account. Please try again.",
      );
      setFormError(message);
      toastError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="py-16">
      <div className="cn-container grid items-stretch gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        {/* The design's cobalt side rail: where you are, and what follows. */}
        <aside className="relative grid content-start gap-6 overflow-hidden rounded-cn-lg bg-cn-accent p-10 text-cn-on-ink">
          <img
            src="/images/design/mark-white.png"
            alt=""
            aria-hidden="true"
            width={220}
            height={269}
            className="pointer-events-none absolute -right-10 -bottom-12 w-[220px] opacity-[0.14]"
          />
          <Link
            href={ROUTES.HOME}
            className="relative inline-flex text-cn-sm font-semibold text-cn-on-ink-2 no-underline hover:underline"
          >
            Cool Nerdz
          </Link>
          <h1 className="relative text-cn-3xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-on-ink">
            Apply to Cool Nerdz.
          </h1>
          <p className="relative text-cn-on-ink-2">
            Create your account, tell us what you want to work on, and start
            your first course.
          </p>

          <ol className="relative m-0 grid list-none gap-2 p-0">
            {JOURNEY.map((step, index) => {
              const isCurrent = index === 0;
              return (
                <li
                  key={step.title}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex items-center gap-4 rounded-cn-sm p-3 transition-[background-color,opacity] duration-200 ${
                    isCurrent ? "bg-white/12 opacity-100" : "opacity-65"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 flex-none place-items-center rounded-full font-bold ${
                      isCurrent
                        ? "border-[1.5px] border-white bg-white text-cn-accent-3"
                        : "border-[1.5px] border-white/50"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <b className="block">{step.title}</b>
                    <small className="text-cn-xs text-cn-on-ink-2">
                      {step.hint}
                    </small>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="relative grid gap-2 border-t border-white/20 pt-6 text-cn-sm">
            <b>What happens next</b>
            <p className="text-cn-on-ink-2">
              {isTeacherSignup
                ? "You'll land in the teacher portal and complete a short application. An admin reviews it before you can publish a course."
                : "You'll be signed in straight away and taken through a short questionnaire that picks your pathway."}
            </p>
          </div>
        </aside>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 rounded-cn-lg border border-cn-rule bg-white p-10 shadow-cn-2"
        >
          <div className="grid gap-2 text-cn-sm font-semibold text-cn-accent">
            <span>Step 1 of 3</span>
            <div className="h-1.5 overflow-hidden rounded-full bg-cn-paper-3">
              <i className="block h-full w-1/3 rounded-[inherit] bg-cn-accent transition-[width] duration-[400ms] ease-cn-out" />
            </div>
          </div>

          <div>
            <h2 className="text-cn-2xl leading-[1.04] font-extrabold tracking-[-0.035em] text-cn-ink">
              Tell us about you.
            </h2>
            <p className="mt-2 text-cn-ink-2">
              This becomes your portal account.
            </p>
          </div>

          <fieldset className="m-0 grid min-w-0 gap-1 border-0 p-0">
            <legend className="mb-1 text-cn-sm font-semibold text-cn-ink">
              I&apos;m applying as
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLE_OPTIONS.map((option) => {
                const isChecked = form.role === option.value;
                return (
                  <label key={option.value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="signup-role"
                      value={option.value}
                      checked={isChecked}
                      onChange={updateField("role")}
                      className="sr-only"
                    />
                    <span
                      className={`grid h-full gap-0.5 rounded-cn border-[1.5px] p-4 transition-[border-color,background-color] duration-150 ${
                        isChecked
                          ? "border-cn-accent bg-cn-paper-3"
                          : "border-cn-rule"
                      }`}
                    >
                      <b>{option.label}</b>
                      <small className="text-cn-xs text-cn-muted">
                        {option.hint}
                      </small>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1">
              <label htmlFor="input-signup-first" className={LABEL}>
                First name
              </label>
              <input
                id="input-signup-first"
                className={FIELD}
                required
                autoComplete="given-name"
                value={form.firstName}
                onChange={updateField("firstName")}
              />
            </div>
            <div className="grid gap-1">
              <label htmlFor="input-signup-last" className={LABEL}>
                Last name
              </label>
              <input
                id="input-signup-last"
                className={FIELD}
                required
                autoComplete="family-name"
                value={form.lastName}
                onChange={updateField("lastName")}
              />
            </div>
          </div>

          <div className="grid gap-1">
            <label htmlFor="input-signup-email" className={LABEL}>
              Email address
            </label>
            <input
              id="input-signup-email"
              type="email"
              className={FIELD}
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField("email")}
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="input-signup-password" className={LABEL}>
              Create a password
            </label>
            <input
              id="input-signup-password"
              type="password"
              className={FIELD}
              required
              autoComplete="new-password"
              value={form.password}
              onChange={updateField("password")}
            />
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cn-rule pt-6">
            <p className="text-cn-sm text-cn-muted">
              Already have an account?{" "}
              <Link
                href={buildAuthUrl(ROUTES.LOGIN, nextPath)}
                className="font-semibold text-cn-accent no-underline hover:underline"
              >
                Log in
              </Link>
            </p>
            <button
              id="submit-signup-btn"
              type="submit"
              disabled={isSubmitting}
              className="ml-auto inline-flex h-[52px] items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 disabled:opacity-70"
            >
              {isSubmitting ? "Creating your account..." : "Create account"}
              {!isSubmitting && <ArrowRight className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
