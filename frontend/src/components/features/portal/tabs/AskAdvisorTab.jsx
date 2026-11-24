"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { askAdvisor, getConversations } from "@/services/messagingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import Loader from "@/components/ui/Loader";
import MessageThread from "@/components/features/messaging/MessageThread";
import PortalCard, { PortalCardHead } from "../shell/PortalCard";
import { PortalButton, PortalKicker, PortalPageHead } from "../shell/PortalUI";

// The design's `SP.advisor`: the conversation beside a panel explaining what
// this is for.
//
// Its left column is a *list* of questions, because the mock gives a student
// many threads. This app gives them one — `messaging.services.assign_advisor`
// puts every question into a single conversation with one assigned advisor —
// so the left column is that conversation, and the ask form stands in for it
// until there is one.
//
// The mock's right column names four advisors ("Coach Vance Miller",
// "Amanda Ross, Esq."...) and promises a reply "within two working days".
// Both are the design's fiction: the advisor here is a real teacher flagged
// `is_advisor`, picked by load, and no turnaround is configured anywhere. A
// student would read invented names as the people who will answer them, so
// the panel says what is true instead — including where to go when something
// cannot wait, which is the one line on this screen that has to be right.

function AskQuestionForm({ onAsked }) {
  const [body, setBody] = useState("");

  const askMutation = useMutation({
    mutationFn: () => askAdvisor(body.trim()),
    onSuccess: (response) => {
      setBody("");
      onAsked(response?.data);
    },
    onError: (error) => {
      toastError(getApiErrorMessage(error, "Unable to send your question. Please try again."));
    },
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!body.trim() || askMutation.isPending) return;
    askMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 p-5">
      <div className="grid gap-1">
        <label htmlFor="advisor-question" className="text-sm font-semibold text-cn-p-ink">
          Your question
        </label>
        <p className="text-sm text-cn-p-ink-2">
          Courses, recruiting, NIL, or anything else you are weighing up.
        </p>
      </div>
      <textarea
        id="advisor-question"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={askMutation.isPending}
        placeholder="Type your question..."
        rows={6}
        className="w-full resize-none rounded-cn-p-sm border border-cn-p-line-2 bg-cn-p-card px-3.5 py-2.5 text-sm text-cn-p-ink transition-[border-color] duration-150 placeholder:text-cn-p-muted hover:border-cn-p-ink-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-cn-p-accent disabled:opacity-60"
      />
      <PortalButton type="submit" disabled={!body.trim() || askMutation.isPending} className="w-full">
        {askMutation.isPending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-[18px] w-[18px]" />
            Send question
          </>
        )}
      </PortalButton>
    </form>
  );
}

export default function AskAdvisorTab() {
  const queryClient = useQueryClient();
  const [justAsked, setJustAsked] = useState(null);

  const conversationQuery = useQuery({
    queryKey: ["conversations", "advisor"],
    queryFn: async () => {
      const response = await getConversations({ conversationType: "advisor", pageSize: 1 });
      return response?.data?.results || [];
    },
    refetchInterval: 15000,
  });

  const conversation = justAsked || conversationQuery.data?.[0] || null;

  const handleAsked = (newConversation) => {
    setJustAsked(newConversation);
    queryClient.invalidateQueries({ queryKey: ["conversations", "advisor"] });
  };

  let panel;
  if (conversationQuery.isError) {
    panel = (
      <div className="flex flex-col items-center gap-3 p-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-cn-p-sm bg-cn-p-bad-bg text-cn-p-bad">
          <AlertCircle className="h-6 w-6" />
        </span>
        <p className="text-sm text-cn-p-ink-2">
          {getApiErrorMessage(conversationQuery.error, "Unable to load your advisor conversation.")}
        </p>
        <PortalButton size="sm" onClick={() => conversationQuery.refetch()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </PortalButton>
      </div>
    );
  } else if (conversationQuery.isLoading) {
    panel = (
      <div className="p-10">
        <Loader fullScreen={false} tone="cobalt" label="Loading your conversation..." />
      </div>
    );
  } else if (conversation) {
    // The thread brings its own header, scroller and composer, so it needs a
    // height to fill rather than a card that grows with the transcript.
    panel = (
      <div className="flex h-[calc(100vh-22rem)] min-h-[420px] flex-col">
        <MessageThread conversation={conversation} />
      </div>
    );
  } else {
    panel = <AskQuestionForm onAsked={handleAsked} />;
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Ask an advisor"
        subtitle="Questions about courses, recruiting, NIL or anything else. Private between you and your advisor."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <PortalCard className="min-w-0 overflow-hidden">
          {conversation && <PortalCardHead title="Your conversation" />}
          {panel}
        </PortalCard>

        <PortalCard className="flex flex-col gap-3 p-5">
          <PortalKicker>How this works</PortalKicker>
          <p className="text-sm text-cn-p-ink-2">
            Your question goes to one advisor from the academy, and their reply
            lands in this conversation. You&apos;ll get a notification when it
            does.
          </p>
          <p className="text-sm text-cn-p-ink-2">
            It is private — only you and your advisor can read it.
          </p>
          {/* The one line here that has to be right. An advisor reply is not
              immediate, so anything that cannot wait must not be left sitting
              in a queue. */}
          <div className="mt-1 flex items-start gap-2.5 rounded-cn-p-sm bg-cn-p-soft p-3.5 text-sm text-cn-p-soft-ink">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              If something is urgent, or you are worried about your safety or
              someone else&apos;s, tell a trusted adult at your school now
              rather than waiting for a reply here.
            </span>
          </div>
        </PortalCard>
      </div>
    </div>
  );
}
