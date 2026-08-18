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

const ONBOARDING_STEPS = [
  { key: "signup", label: "Sign Up" },
  { key: "questionnaire", label: "Questionnaire" },
  { key: "recommendation", label: "Pathway" },
  { key: "preview", label: "Preview" },
  { key: "checkout", label: "Checkout" },
  { key: "complete", label: "Access" },
];

const PROGRESS_QUERY_KEY = ["onboarding-progress"];

/**
 * Controller for the public onboarding flow: Signup -> Questionnaire ->
 * Pathway Recommendation -> Pathway Preview -> Checkout -> LMS Access.
 *
 * Step/selection state is deliberately plain React state, not Redux — but it
 * IS mirrored to the backend (OnboardingProgress, see onboardingService.js)
 * on every step transition so a refresh, closed browser, or logging in again
 * resumes at the same step instead of restarting. Do not reuse
 * store/slices/intake/intakeSlice.js, which is unrelated (future-clients
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

  const shouldLeaveWizard =
    isAuthResolved &&
    isAuthenticated &&
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
    return <Loader label="Loading your progress..." />;
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] pb-24">
      <div className="max-w-3xl mx-auto px-6 pt-12">
        <OnboardingProgress steps={ONBOARDING_STEPS} activeIndex={activeIndex} />
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
  );
}
