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
      {/* The page's one cobalt field, as the design uses its closing panel. */}
      <div
        id="build-your-own-pathway-banner"
        className="cn-cta-dots relative isolate mb-10 overflow-hidden rounded-cn-lg bg-cn-accent p-6 text-white shadow-cn-3 sm:p-8"
      >
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-cn bg-white/20 text-white backdrop-blur-[6px]">
            <Wand2 className="w-5 h-5" />
          </div>

          <div className="min-w-0 space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-[6px]">
              <Sparkles className="w-3 h-3" />
              Build Your Own
            </span>
            <h3 className="text-cn-xl leading-tight font-bold tracking-[-0.015em] text-white">
              Can&apos;t find the right mix? Create your own pathway.
            </h3>
            <p className="max-w-[62ch] text-sm leading-relaxed text-cn-on-ink-2">
              {/* One template literal rather than text around a JSX
                  expression: the compiler drops the space that follows
                  `{...}` at a line break, which rendered this as
                  "Hand-pick 2or more courses". */}
              {`Hand-pick ${MIN_CUSTOM_PATHWAY_COURSES} or more courses, bundle them into a pathway that's yours, and buy the whole thing in one go — you're enrolled in every course inside it straight away.`}
            </p>
          </div>

          <button
            id="build-your-own-pathway-trigger-btn"
            type="button"
            onClick={handleStartBuilding}
            className="inline-flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-cn-sm bg-white px-6 text-sm font-semibold text-cn-accent-3 transition-transform duration-150 ease-cn-out hover:-translate-y-px lg:ml-auto"
          >
            Start Building
            <ArrowRight className="w-4 h-4" />
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
