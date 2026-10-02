"use client";

import Link from "next/link";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { ROUTES } from "@/constants/routes";
import { buildAuthUrl } from "@/lib/authRedirect";

// Shown when a guest tries to select or enrol in a pathway, instead of
// bouncing them straight to /login. Mirrors the cart's SignInToPurchaseModal;
// `nextPath` is carried as `?next=` so useGuestOnlyRoute returns them to this
// exact page once they've signed in.
export default function SignInToSelectModal({
  isOpen,
  onClose,
  pathwayName,
  nextPath = ROUTES.PATHWAYS,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={ShieldCheck}
      title="Sign in to select this pathway"
      subtitle="A student account is needed to enrol"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <p className="text-sm font-light leading-relaxed text-muted">
          {pathwayName ? (
            <>
              <span className="font-medium text-ink">{pathwayName}</span> is purchased
              with a student account.
            </>
          ) : (
            "Pathways are purchased with a student account."
          )}{" "}
          Sign in and we&apos;ll bring you straight back here to finish.
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
