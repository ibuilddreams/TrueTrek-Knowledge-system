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

export default function AskAdvisorModal({ isOpen, onClose }) {
  const router = useRouter();
  const [body, setBody] = useState("");

  const askMutation = useMutation({
    mutationFn: () => askAdvisor(body.trim()),
    onSuccess: () => {
      setBody("");
      onClose();
      router.push(`${ROUTES.STUDENT_PORTAL}?tab=advisor`);
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
      subtitle="An advisor will reply in your student portal"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={askMutation.isPending}
          placeholder="What would you like to ask?"
          rows={4}
          autoFocus
          className="w-full px-4 py-3 bg-porcelain border border-line focus:border-pine focus:bg-paper focus:outline-none rounded-xl text-sm font-mono text-ink placeholder:text-muted transition disabled:opacity-60 resize-none"
        />

        <button
          type="submit"
          disabled={!body.trim() || askMutation.isPending}
          className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-moss disabled:opacity-60 disabled:cursor-not-allowed text-paper font-sans text-xs font-medium uppercase tracking-widest py-3.5 rounded-full shadow-soft transition"
        >
          {askMutation.isPending ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-paper border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Question
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
