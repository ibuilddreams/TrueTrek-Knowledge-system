"use client";

import Link from "next/link";
import { LogIn, ShieldCheck, UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { ROUTES } from "@/constants/routes";
import { buildAuthUrl } from "@/lib/authRedirect";

// `nextPath` is the page the visitor returns to after signing in or signing up.
export default function SignInToPurchaseModal({
  isOpen,
  onClose,
  courseCount,
  nextPath = ROUTES.CART,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={ShieldCheck}
      title="Sign in to purchase"
      subtitle="A student account is needed to enroll"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <p className="text-sm text-muted font-light leading-relaxed">
          Please sign in before purchasing. Your{" "}
          {courseCount === 1 ? "course is" : `${courseCount} courses are`} saved
          in your cart and will be waiting for you right after you sign in.
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
          Keep Browsing Cart
        </button>
      </div>
    </Modal>
  );
}
