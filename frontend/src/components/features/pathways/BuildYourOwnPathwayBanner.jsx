"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import { MIN_CUSTOM_PATHWAY_COURSES } from "@/constants/pathways";
import { toastInfo } from "@/lib/toast";
import SignInToBuildModal from "./SignInToBuildModal";

// The "build your own pathway" entry point on /pathways. Role handling matches
// how PathwaysStore gates selecting a pathway: guests get the sign-in prompt
// (never an abrupt redirect), teachers/admins get a polite note, students go
// to the builder.
export default function BuildYourOwnPathwayBanner() {
  const router = useRouter();
  const { isAuthenticated, isStudent } = useAuth();
  const [isSignInPromptOpen, setIsSignInPromptOpen] = useState(false);

  function handleStartBuilding() {
    if (!isAuthenticated) {
      setIsSignInPromptOpen(true);
      return;
    }

    if (!isStudent) {
      toastInfo("Only student accounts can build their own pathway.");
      return;
    }

    router.push(ROUTES.PATHWAY_BUILDER);
  }

  return (
    <>
      <div
        id="build-your-own-pathway-banner"
        className="relative overflow-hidden rounded-2xl border border-gold/30 bg-pine text-paper p-6 sm:p-7 mb-10"
      >
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-10 w-72 h-72 rounded-full bg-gold/15 blur-[110px]"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
          <div className="w-11 h-11 rounded-xl bg-gold/20 border border-gold/30 text-gold flex items-center justify-center shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>

          <div className="min-w-0 space-y-1.5">
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 px-3 py-1 rounded-full text-gold font-sans text-[10px] uppercase tracking-widest font-medium">
              <Sparkles className="w-3 h-3" />
              Build Your Own
            </span>
            <h3 className="text-2xl font-serif font-light leading-tight text-paper">
              Can&apos;t find the right mix? Create your own pathway.
            </h3>
            <p className="text-xs font-light leading-relaxed text-paper/70 max-w-xl">
              Hand-pick {MIN_CUSTOM_PATHWAY_COURSES} or more courses, bundle them
              into a pathway that&apos;s yours, and buy the whole thing in one go
              — you&apos;re enrolled in every course inside it straight away.
            </p>
          </div>

          <button
            id="build-your-own-pathway-trigger-btn"
            type="button"
            onClick={handleStartBuilding}
            className="lg:ml-auto shrink-0 inline-flex items-center justify-center gap-2 bg-gold hover:brightness-95 text-ink font-sans text-xs font-semibold uppercase tracking-widest px-6 py-3.5 rounded-full shadow-md transition-all duration-200"
          >
            Start Building
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <SignInToBuildModal
        isOpen={isSignInPromptOpen}
        onClose={() => setIsSignInPromptOpen(false)}
      />
    </>
  );
}
