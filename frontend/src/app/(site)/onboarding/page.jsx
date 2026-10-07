import OnboardingWizard from "@/components/features/onboarding/OnboardingWizard";

export const metadata = {
  title: "Get Started | Cool Nerds",
  description:
    "Sign up, tell us your goals, and get a personalized course pathway recommendation.",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
