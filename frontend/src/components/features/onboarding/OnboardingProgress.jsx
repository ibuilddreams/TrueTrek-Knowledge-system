"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { ROUTES } from "@/constants/routes";

/**
 * The wizard's cobalt side rail — the design's `.auth .l` panel, and
 * deliberately the same component shape as the rail on `/signup`
 * (`features/auth/SignupForm`'s `JOURNEY` list), because this screen is where
 * that page hands a new student off. Reusing the rail is what makes the two
 * read as one journey rather than two products.
 *
 * It is purely presentational: `OnboardingWizard` owns which step is active.
 */
export default function OnboardingProgress({ steps, activeIndex }) {
  return (
    <aside
      aria-label="Onboarding progress"
      // Sticky so the step list stays beside a long step (the pathway list is
      // nine cards tall) instead of scrolling away or being stretched into a
      // column of empty cobalt. Once the rail stacks above the card it drops
      // back to `relative`, and the two overrides beside it are both needed:
      //
      //   • `relative` rather than `static`, because the watermark below is
      //     absolutely positioned and a static ancestor is not its containing
      //     block — it would escape this panel's `overflow-hidden` and push
      //     40px of sideways scroll onto the page (measured: 430px of scroll
      //     in a 390px viewport).
      //   • `top-0`, because a relatively positioned box still honours `top`:
      //     leaving the sticky offset on shifted the whole rail 100px down its
      //     own grid row and painted it over the card's step meter.
      className="relative grid content-start gap-6 overflow-hidden rounded-cn-lg bg-cn-accent p-10 text-cn-on-ink sticky top-[calc(var(--cn-nav-h)+24px)] max-[60rem]:relative max-[60rem]:top-0 max-[60rem]:p-6"
    >
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
        Set up your learning.
      </h1>
      <p className="relative text-cn-on-ink-2">
        Your account is ready. Tell us where you are, pick the pathway that
        fits, and it opens in your portal.
      </p>

      <ol className="relative m-0 grid list-none gap-2 p-0">
        {steps.map((step, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center gap-4 rounded-cn-sm p-3 transition-[background-color,opacity] duration-200 ${
                isCurrent ? "bg-white/12 opacity-100" : "opacity-65"
              }`}
            >
              <span
                aria-hidden="true"
                className={`grid h-9 w-9 flex-none place-items-center rounded-full font-bold ${
                  isCurrent || isComplete
                    ? "border-[1.5px] border-white bg-white text-cn-accent-3"
                    : "border-[1.5px] border-white/50"
                }`}
              >
                {isComplete ? (
                  <Check className="h-[18px] w-[18px]" strokeWidth={3} />
                ) : (
                  index + 1
                )}
              </span>
              <span>
                <b className="block">{step.label}</b>
                <small className="text-cn-xs text-cn-on-ink-2">
                  {step.hint}
                </small>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Below `lg` the rail stacks above the card, so everything here is
          scrolled past before the student reaches the question. The step list
          earns its place there; this reassurance does not, so it is the one
          part that drops on a phone. */}
      <div className="relative grid gap-2 border-t border-white/20 pt-6 text-cn-sm max-[60rem]:hidden">
        <b>You can stop at any point</b>
        <p className="text-cn-on-ink-2">
          Your answers are saved as you go, so closing this page picks up where
          you left off next time you sign in.
        </p>
      </div>
    </aside>
  );
}
