"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useNeedsOnboarding } from "@/hooks/useNeedsOnboarding";
import {
  clearOnboardingProgress,
  getOnboardingProgress,
  saveOnboardingProgress,
} from "@/services/onboardingService";
import { AUTH_ROLES } from "@/constants/auth";
import { ROUTES, getPortalRouteForRole } from "@/constants/routes";
import Loader from "@/components/ui/Loader";
import OnboardingProgress from "./OnboardingProgress";
import QuestionnaireStep from "./QuestionnaireStep";
import RecommendationStep from "./RecommendationStep";
import PathwayPreviewStep from "./PathwayPreviewStep";
import PathwayCheckoutStep from "./PathwayCheckoutStep";
import LmsAccessStep from "./LmsAccessStep";

// The steps this wizard actually renders. Signing up is no longer one of them
// — it has its own page (/signup), and `OnboardingProgress` is the same rail
// that page shows, so a student arriving here sees the journey continue rather
// than restart. The first four keys match `onboarding.OnboardingProgress.Step`
// on the backend, which is what a resumed run is restored from; "complete" is
// local to this session (nothing is saved once checkout has happened).
const ONBOARDING_STEPS = [
  { key: "questionnaire", label: "Your goals", hint: "A few quick questions" },
  { key: "recommendation", label: "Your pathway", hint: "Matched to your answers" },
  { key: "preview", label: "Preview", hint: "What's included" },
  { key: "checkout", label: "Checkout", hint: "Confirm and start" },
  { key: "complete", label: "Start learning", hint: "Your portal is ready" },
];

const PROGRESS_QUERY_KEY = ["onboarding-progress"];

/**
 * Controller for the student onboarding flow: Questionnaire -> Pathway
 * Recommendation -> Pathway Preview -> Checkout -> LMS Access. (Signing up is
 * no longer part of it — see the note further down.)
 *
 * It owns the screen's frame as well as its state: the cobalt rail
 * (`OnboardingProgress`) and the white card every step renders into, so each
 * step component is a body and its actions rather than a page of its own —
 * which is what keeps five screens looking like one wizard.
 *
 * Step/selection state is deliberately plain React state, not Redux — but it
 * IS mirrored to the backend (OnboardingProgress, see onboardingService.js)
 * on every step transition so a refresh, closed browser, or logging in again
 * resumes at the same step instead of restarting. Do not reuse
 * store/slices/intake/intakeSlice.js, which is unrelated (a leftover
 * marketing lead-capture form) and was never meant to survive a reload.
 */
export default function OnboardingWizard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // `status` (not just `isAuthenticated`) matters here: on a fresh page load
  // the auth slice starts as `status: "loading"` while cookies are checked
  // (see hooks/useAuth.js / providers/AuthProvider.jsx), and briefly reports
  // isAuthenticated=false during that gap. Deciding the starting step off a
  // one-time read of isAuthenticated (the previous bug) locks in that stale
  // "logged out" snapshot forever, even once auth resolves a moment later.
  const { status: authStatus, isAuthenticated, role } = useAuth();
  const isAuthResolved = authStatus !== "loading";
  const isStudentRole = role === AUTH_ROLES.STUDENT;

  const shouldLoadStudentState = isAuthResolved && isAuthenticated && isStudentRole;

  // Pathways/onboarding are a student-only concept. A returning,
  // already-onboarded student (has a pathway already) shouldn't be forced
  // back through the wizard just for landing on this route again, and a
  // teacher/admin account should never see it at all — both cases send the
  // visitor straight to their own portal instead.
  const { isChecking: isCheckingNeedsOnboarding, needsOnboarding } =
    useNeedsOnboarding(shouldLoadStudentState);

  const progressQuery = useQuery({
    queryKey: PROGRESS_QUERY_KEY,
    queryFn: async () => (await getOnboardingProgress())?.data || null,
    enabled: shouldLoadStudentState,
    refetchOnWindowFocus: false,
  });

  const saveProgressMutation = useMutation({
    mutationFn: saveOnboardingProgress,
  });

  const [step, setStep] = useState(null);
  const [answers, setAnswers] = useState({});
  const [selectedPathwayIds, setSelectedPathwayIds] = useState([]);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const hasResumed = useRef(false);

  // `step !== "complete"` is what makes the last step reachable at all. The
  // only thing that sets "complete" is a checkout that just succeeded, and the
  // refetch it awaits (`PathwayCheckoutStep`, so the portal's guard can't bounce
  // the student back here) is exactly what flips `needsOnboarding` to false —
  // so without this the confirmation screen was replaced by a redirect to the
  // portal in the same tick it was rendered, and nobody ever saw step 5. A
  // student arriving here already onboarded still leaves, because `step` is
  // null until it is resumed from the server, which can only ever return one of
  // the first four.
  const shouldLeaveWizard =
    isAuthResolved &&
    isAuthenticated &&
    step !== "complete" &&
    (!isStudentRole || (!isCheckingNeedsOnboarding && !needsOnboarding));

  // Signup now lives on its own dedicated page (/signup) instead of being
  // rendered as this wizard's first step — an unauthenticated visitor is
  // sent there, and useGuestOnlyRoute on that page sends a freshly-signed-up
  // student straight back here once authenticated (landing on Questionnaire).
  const shouldRedirectToSignup = isAuthResolved && !isAuthenticated;

  useEffect(() => {
    if (shouldLeaveWizard) {
      router.replace(getPortalRouteForRole(role));
    } else if (shouldRedirectToSignup) {
      router.replace(ROUTES.SIGNUP);
    }
  }, [shouldLeaveWizard, shouldRedirectToSignup, role, router]);

  // Runs exactly once, as soon as enough is known to decide the resume
  // point — never re-runs afterward, so it can't clobber in-progress state
  // once the wizard is actually showing.
  useEffect(() => {
    if (hasResumed.current || !isAuthResolved) return;

    if (!isAuthenticated) {
      // Nothing to resume — shouldRedirectToSignup's effect sends the
      // visitor to /signup. Leave `step` null so the Loader stays up.
      hasResumed.current = true;
      return;
    }

    if (!isStudentRole) {
      // Non-student accounts never render the wizard body (shouldLeaveWizard
      // redirects them away) — nothing to resume.
      hasResumed.current = true;
      return;
    }

    if (isCheckingNeedsOnboarding || progressQuery.isLoading) return;

    if (!needsOnboarding) {
      // Already onboarded — shouldLeaveWizard's effect handles the redirect.
      hasResumed.current = true;
      return;
    }

    const saved = progressQuery.data;
    if (saved?.step) {
      setStep(saved.step.toLowerCase());
      setSelectedPathwayIds(saved.selected_pathway_ids || []);
    } else {
      setStep("questionnaire");
    }
    hasResumed.current = true;
  }, [
    isAuthResolved,
    isAuthenticated,
    isStudentRole,
    isCheckingNeedsOnboarding,
    needsOnboarding,
    progressQuery.isLoading,
    progressQuery.data,
  ]);

  // Steps swap in place (no route change), so the previous step's scroll
  // offset would otherwise carry over to the next step.
  useEffect(() => {
    if (step) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step]);

  function goToStep(nextStep, nextSelectedPathwayIds = selectedPathwayIds) {
    setStep(nextStep);
    saveProgressMutation.mutate({
      step: nextStep.toUpperCase(),
      selectedPathwayIds: nextSelectedPathwayIds,
    });
  }

  function handleCheckoutComplete(result) {
    setCheckoutResult(result);
    setStep("complete");
    // Onboarding is finished — nothing left to resume, and leaving a stale
    // CHECKOUT row around would otherwise send a future direct /onboarding
    // visit (before this tab's needsOnboarding check catches up) back into
    // a checkout step for pathways they already bought.
    clearOnboardingProgress().catch(() => {});
    queryClient.removeQueries({ queryKey: PROGRESS_QUERY_KEY });
  }

  const activeIndex = useMemo(
    () => Math.max(0, ONBOARDING_STEPS.findIndex((s) => s.key === step)),
    [step]
  );

  if (shouldLeaveWizard || shouldRedirectToSignup || step === null) {
    // Cobalt, like /login and /signup on either side of it: the porcelain
    // default painted a cream page and a pine spinner under the cobalt navbar,
    // which read as a second, older loading screen on the way in.
    return <Loader tone="cobalt" label="Loading your progress..." />;
  }

  return (
    <section className="py-16 max-[60rem]:py-10">
      {/* The design's two-column auth layout: the cobalt rail on the left
          saying where this is going, the white card on the right carrying the
          step. Below 60rem the rail stacks above the card, as /signup does.
          `items-start` rather than /signup's `items-stretch`: the pathway step
          runs to nine cards and a stretched rail would be a thousand pixels of
          empty cobalt beside it. The rail follows instead — see its own
          `sticky`. */}
      <div className="cn-container grid items-start gap-6 grid-cols-[minmax(0,4fr)_minmax(0,8fr)] max-[60rem]:grid-cols-[minmax(0,1fr)]">
        <OnboardingProgress steps={ONBOARDING_STEPS} activeIndex={activeIndex} />

        <div className="grid content-start gap-6 rounded-cn-lg border border-cn-rule bg-white p-10 shadow-cn-2 max-[60rem]:p-6">
          <div className="grid gap-2 text-cn-sm font-semibold text-cn-accent">
            <span>
              Step {activeIndex + 1} of {ONBOARDING_STEPS.length}
            </span>
            <div className="h-1.5 overflow-hidden rounded-full bg-cn-paper-3">
              <i
                className="block h-full rounded-[inherit] bg-cn-accent transition-[width] duration-[400ms] ease-cn-out"
                style={{
                  width: `${((activeIndex + 1) / ONBOARDING_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {step === "questionnaire" && (
            <QuestionnaireStep
              answers={answers}
              onAnswersChange={setAnswers}
              onContinue={() => goToStep("recommendation")}
            />
          )}

          {step === "recommendation" && (
            <RecommendationStep
              selectedPathwayIds={selectedPathwayIds}
              onSelectionChange={setSelectedPathwayIds}
              onContinue={() => goToStep("preview")}
            />
          )}

          {step === "preview" && (
            <PathwayPreviewStep
              selectedPathwayIds={selectedPathwayIds}
              onBack={() => goToStep("recommendation")}
              onContinue={() => goToStep("checkout")}
            />
          )}

          {step === "checkout" && (
            <PathwayCheckoutStep
              selectedPathwayIds={selectedPathwayIds}
              onBack={() => goToStep("preview")}
              onComplete={handleCheckoutComplete}
            />
          )}

          {step === "complete" && <LmsAccessStep checkoutResult={checkoutResult} />}
        </div>
      </div>
    </section>
  );
}
