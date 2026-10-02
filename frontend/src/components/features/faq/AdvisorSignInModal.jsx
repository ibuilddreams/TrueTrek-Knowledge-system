"use client";

import Link from "next/link";
import { LogIn, MessageCircleQuestion, UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { ROUTES } from "@/constants/routes";
import { buildAuthUrl } from "@/lib/authRedirect";

export default function AdvisorSignInModal({ isOpen, onClose }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={MessageCircleQuestion}
      title="Sign in to contact an advisor"
      subtitle="A student account is needed to start a conversation"
      maxWidth="max-w-md"
    >
      <div className="space-y-5">
        <p className="text-sm text-muted font-light leading-relaxed">
          Sign in to your student account to ask an advisor directly — you&apos;ll find
          &quot;Ask an Advisor&quot; in your student portal once you&apos;re signed in.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={buildAuthUrl(ROUTES.LOGIN)}
            className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-moss text-paper font-sans text-xs font-medium uppercase tracking-widest py-3.5 rounded-full shadow-soft transition"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
          <Link
            href={buildAuthUrl(ROUTES.SIGNUP)}
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
          Keep Browsing
        </button>
      </div>
    </Modal>
  );
}
