"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, MessageCircleQuestion, RefreshCw, Send } from "lucide-react";
import { askAdvisor, getConversations } from "@/services/messagingService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import { toastError } from "@/lib/toast";
import MessageThread from "@/components/features/messaging/MessageThread";

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
    <div className="flex-1 flex items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md text-center">
        <div className="w-12 h-12 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageCircleQuestion className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-stone-800 mb-1">Ask an Advisor</p>
        <p className="text-xs text-stone-500 font-light mb-5">
          Have a question about your courses, career path, or anything else? Send it here and an
          advisor will get back to you.
        </p>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={askMutation.isPending}
          placeholder="Type your question..."
          rows={4}
          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 focus:border-stone-400 focus:bg-white focus:outline-none rounded-xl text-sm text-stone-800 placeholder:text-stone-400 transition disabled:opacity-60 resize-none"
        />
        <button
          type="submit"
          disabled={!body.trim() || askMutation.isPending}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 disabled:cursor-not-allowed text-stone-100 font-bold font-mono text-sm uppercase tracking-wider rounded-xl shadow-md transition"
        >
          {askMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-stone-100 border-t-transparent rounded-full animate-spin" />
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
    </div>
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

  const wrapperClass =
    "bg-white border border-stone-200/95 rounded-2xl shadow-xl overflow-hidden relative flex flex-col min-h-120 h-[calc(100vh-16rem)]";

  if (conversationQuery.isError) {
    return (
      <div className={`${wrapperClass} items-center justify-center p-8 text-center`}>
        <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-sm text-stone-500 font-light mb-6">
          {getApiErrorMessage(conversationQuery.error, "Unable to load your advisor conversation.")}
        </p>
        <button
          type="button"
          onClick={() => conversationQuery.refetch()}
          className="inline-flex items-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-sm uppercase tracking-wider rounded-xl shadow-md transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={wrapperClass}>
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

      {conversationQuery.isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-stone-300 animate-spin" />
        </div>
      ) : conversation ? (
        <MessageThread conversation={conversation} />
      ) : (
        <AskQuestionForm onAsked={handleAsked} />
      )}
    </div>
  );
}
