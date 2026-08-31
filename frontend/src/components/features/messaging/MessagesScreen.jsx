"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants/routes";
import AuthGateCard from "@/components/ui/AuthGateCard";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import EmptyThreadState from "./EmptyThreadState";
import NewMessageButton from "./NewMessageButton";
import NewMessageModal from "./NewMessageModal";

export default function MessagesScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <AuthGateCard
        id="messages-gate-container"
        icon={Lock}
        title="Sign In Required"
        subtitle="Sign in to view and send messages."
      >
        <button
          type="button"
          onClick={() => router.push(ROUTES.LOGIN)}
          className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold font-mono text-sm uppercase tracking-wider rounded-xl shadow-md transition"
        >
          Go to Sign In
        </button>
      </AuthGateCard>
    );
  }

  const handleConversationStarted = (conversation) => {
    setIsNewMessageOpen(false);
    if (conversation) setSelectedConversation(conversation);
  };

  return (
    <div className="py-8 px-4 sm:px-6 md:px-10 max-w-[1600px] mx-auto h-[calc(100vh-5rem)] flex flex-col overflow-hidden font-sans">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 shrink-0">
        <div>
          <span className="text-amber-600 font-mono text-sm uppercase tracking-widest font-bold block mb-1">
            Communication
          </span>
          <h1 className="text-3xl font-serif font-black tracking-tight text-stone-900">Messages</h1>
          <p className="text-sm text-stone-500 font-light mt-0.5">
            Send and receive direct messages.
          </p>
        </div>
        <NewMessageButton onClick={() => setIsNewMessageOpen(true)} />
      </div>

      <div className="bg-white border border-stone-200/95 rounded-2xl shadow-xl overflow-hidden relative flex flex-col sm:flex-row flex-1 min-h-120">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

        {/* Below the sm breakpoint there's only room for one panel at a time —
            show the list OR the open thread (with a back button), not both
            stacked. At sm and up both panels are always visible side by side. */}
        <div
          className={`${selectedConversation ? "hidden" : "flex"} sm:flex flex-col w-full sm:w-80 flex-1 sm:flex-none min-h-0 border-b sm:border-b-0 sm:border-r border-stone-100`}
        >
          <ConversationList
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={setSelectedConversation}
          />
        </div>

        <div className={`${selectedConversation ? "flex" : "hidden"} sm:flex flex-1 min-w-0 flex-col min-h-0`}>
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <EmptyThreadState />
          )}
        </div>
      </div>

      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onConversationStarted={handleConversationStarted}
      />
    </div>
  );
}
