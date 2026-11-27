"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { MessageCircleQuestion, Send } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { ROUTES } from "@/constants/routes";
import { askAdvisor } from "@/services/messagingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";

// The question box itself, opened once the viewer is signed in. Unlike the
// prompt beside it this is a form rather than a sign-in, so it renders
// `ui/Modal`'s cobalt variant — the small `.dlgbox` the design file draws —
// rather than the two-column `SignInModal`.
export default function AskAdvisorModal({ isOpen, onClose }) {
  const router = useRouter();
  const [body, setBody] = useState("");

  const askMutation = useMutation({
    mutationFn: () => askAdvisor(body.trim()),
    onSuccess: () => {
      setBody("");
      onClose();
      router.push(`${ROUTES.STUDENT_PORTAL}/advisor`);
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to send your question. Please try again."));
    },
  });

  const handleClose = () => {
    if (askMutation.isPending) return;
    setBody("");
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!body.trim() || askMutation.isPending) return;
    askMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      icon={MessageCircleQuestion}
      title="Ask an Advisor"
      subtitle="An advisor will reply in your Cool Nerdz Portal"
      maxWidth="max-w-[460px]"
    >
      <form onSubmit={handleSubmit} className="grid gap-5">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={askMutation.isPending}
          placeholder="What would you like to ask?"
          rows={4}
          autoFocus
          className="w-full resize-none rounded-cn-sm border border-cn-muted bg-cn-paper px-4 py-3 text-cn-base text-cn-ink transition-[border-color] duration-[140ms] ease-cn-out placeholder:text-cn-muted hover:border-cn-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-accent disabled:cursor-not-allowed disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!body.trim() || askMutation.isPending}
          className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-cn-sm bg-cn-accent px-6 text-cn-base font-semibold text-white shadow-cn-1 transition-[background-color,transform] duration-150 ease-cn-out enabled:hover:-translate-y-px enabled:hover:bg-cn-accent-2 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-cn-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {askMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-[18px] w-[18px]" />
              Send question
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
