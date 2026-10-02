"use client";

import { useState } from "react";
import ConversationList from "@/components/features/messaging/ConversationList";
import MessageThread from "@/components/features/messaging/MessageThread";
import EmptyThreadState from "@/components/features/messaging/EmptyThreadState";

export default function AdvisorQuestionsTab() {
  const [selectedConversation, setSelectedConversation] = useState(null);

  return (
    <div className="bg-white border border-stone-200/95 rounded-2xl shadow-xl overflow-hidden relative flex flex-col sm:flex-row min-h-120 h-[calc(100vh-16rem)]">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-600 to-amber-800" />

      <div
        className={`${selectedConversation ? "hidden" : "flex"} sm:flex flex-col w-full sm:w-80 flex-1 sm:flex-none min-h-0 border-b sm:border-b-0 sm:border-r border-stone-100`}
      >
        <ConversationList
          conversationType="advisor"
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={setSelectedConversation}
          emptyLabel="No questions yet."
          emptyDescription="Student questions sent to you as an advisor will show up here."
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
  );
}
