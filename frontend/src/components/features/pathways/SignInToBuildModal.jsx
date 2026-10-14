"use client";

import Link from "next/link";
import { LogIn, UserPlus, Wand2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { ROUTES } from "@/constants/routes";
import { buildAuthUrl } from "@/lib/authRedirect";

// Shown when a guest taps "Build your own pathway". Same shape as the cart's
// SignInToPurchaseModal and SignInToSelectModal: `nextPath` rides along as
// `?next=` so signing in drops them straight into the builder instead of the
// generic portal landing.
export default function SignInToBuildModal({
  isOpen,
  onClose,
  nextPath = ROUTES.PATHWAY_BUILDER,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={Wand2}
      title="Sign in to build your pathway"
      subtitle="A student account is needed to bundle courses"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <p className="text-sm font-light leading-relaxed text-muted">
          Pick any courses you like, bundle them into a pathway of your own, and
          buy them together. Sign in and we&apos;ll take you straight to the
          builder.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={buildAuthUrl(ROUTES.LOGIN, nextPath)}
            className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper font-sans text-xs font-medium uppercase tracking-widest py-3.5 rounded-full shadow-soft transition"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
          <Link
            href={buildAuthUrl(ROUTES.SIGNUP, nextPath)}
            className="w-full flex items-center justify-center gap-2 bg-porcelain hover:bg-line/40 border border-line text-ink font-sans text-xs font-medium uppercase tracking-widest py-3.5 rounded-full transition"
          >
            <UserPlus className="w-4 h-4" />
            Create Student Account
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs font-sans font-medium uppercase tracking-widest text-muted hover:text-ink transition-colors"
        >
          Keep Browsing Pathways
        </button>
      </div>
    </Modal>
  );
}
