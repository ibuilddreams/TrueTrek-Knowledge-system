"use client";

import { useEffect, useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AdvisorSignInModal from "./AdvisorSignInModal";
import AskAdvisorModal from "./AskAdvisorModal";

// Entry point for the real "Ask an Advisor" live chat feature — distinct
// from the "Talk to an advisor" sidebar link elsewhere on this page, which
// goes to the unrelated Future Clients marketing intake form.
export default function ContactAdvisorEntry({ id, className, icon: Icon = MessageCircleQuestion }) {
  const { isAuthenticated, isStudent } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isAskOpen, setIsAskOpen] = useState(false);

  // `isAuthenticated`/`isStudent` come from client-only Redux state, absent
  // during the server/prerendered pass — rendering the same button on the
  // first client paint regardless of auth state avoids a hydration mismatch,
  // same pattern as MessagesScreen.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isMounted && isAuthenticated && !isStudent) {
    // Advisor contact is a student-facing feature only.
    return null;
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      setIsSignInOpen(true);
    } else {
      setIsAskOpen(true);
    }
  };

  return (
    <>
      <button type="button" id={id} onClick={handleClick} className={className}>
        Ask an Advisor
        <Icon className="w-4 h-4" />
      </button>

      <AdvisorSignInModal isOpen={isSignInOpen} onClose={() => setIsSignInOpen(false)} />
      <AskAdvisorModal isOpen={isAskOpen} onClose={() => setIsAskOpen(false)} />
    </>
  );
}
