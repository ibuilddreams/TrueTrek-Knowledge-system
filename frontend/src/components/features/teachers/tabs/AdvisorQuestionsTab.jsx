"use client";

import { useState } from "react";
import ConversationList from "@/components/features/messaging/ConversationList";
import MessageThread from "@/components/features/messaging/MessageThread";
import EmptyThreadState from "@/components/features/messaging/EmptyThreadState";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import { PortalPageHead } from "@/components/features/portal/shell/PortalUI";

export default function AdvisorQuestionsTab() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Ask an advisor"
        subtitle="Questions students have sent you as their advisor. Replies go straight back to them."
      />

      <PortalCard className="relative flex h-[calc(100vh-220px)] min-h-[520px] flex-col overflow-hidden sm:flex-row">
        <div
          className={`${selectedConversation ? "hidden" : "flex"} min-h-0 w-full flex-1 flex-col border-b border-cn-p-line sm:flex sm:w-[300px] sm:flex-none sm:border-b-0 sm:border-r`}
        >
          <ConversationList
            conversationType="advisor"
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={setSelectedConversation}
            emptyLabel="No questions yet"
            emptyDescription="Student questions sent to you as an advisor show up here."
          />
        </div>

        <div
          className={`${selectedConversation ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col sm:flex`}
        >
          {selectedConversation ? (
            <MessageThread
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
            />
          ) : (
            <EmptyThreadState />
          )}
        </div>
      </PortalCard>
    </div>
  );
}
