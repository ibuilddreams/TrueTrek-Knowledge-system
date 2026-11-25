"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mail } from "lucide-react";
import Loader from "@/components/ui/Loader";
import PortalCard from "@/components/features/portal/shell/PortalCard";
import { PortalEmpty, PortalPageHead } from "@/components/features/portal/shell/PortalUI";
import ConversationList from "./ConversationList";
import MessageThread from "./MessageThread";
import EmptyThreadState from "./EmptyThreadState";
import NewMessageButton from "./NewMessageButton";
import NewMessageModal from "./NewMessageModal";
import { useConversations } from "./useConversations";

/**
 * The design's `messagesPage(role)` — a `.phead` carrying the "New message"
 * action, then the `.chat` card: a 300px column of conversations beside the
 * open thread.
 *
 * One screen serves all three portals, exactly as the design has it
 * (`PAGES[role].messages` is the same page for student, teacher and admin —
 * only the people on the other end differ, and the server already decides
 * that). It is rendered inside `PortalShell`, so it brings no page frame,
 * no heading band and no auth gate of its own: the portal route is what
 * decides who is allowed in, and `/messages` redirects into the portal.
 */
function MessagesScreenContent() {
  const searchParams = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

  // Deep-linked from elsewhere (e.g. a teacher's "Message student" action on
  // the Students & scores drawer) — ConversationList selects it once loaded.
  const autoSelectConversationId = searchParams.get("conversation");

  // Only for the choice of shape below; the list fetches through the same
  // query key, so this costs no second request.
  const conversationsQuery = useConversations();
  const hasConversations = (conversationsQuery.data || []).length > 0;

  const handleConversationStarted = (conversation) => {
    setIsNewMessageOpen(false);
    if (conversation) setSelectedConversation(conversation);
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <PortalPageHead
        title="Messages"
        subtitle="Direct messages with your teachers, students and the Cool Nerdz team."
      >
        <NewMessageButton onClick={() => setIsNewMessageOpen(true)} />
      </PortalPageHead>

      {conversationsQuery.isLoading ? (
        <PortalCard className="grid min-h-[520px] place-items-center">
          <Loader fullScreen={false} tone="cobalt" label="Loading messages..." />
        </PortalCard>
      ) : !hasConversations ? (
        // The design shows one empty card here rather than a split pane with
        // an empty state on each side, which is what two panels of "nothing
        // yet" read as.
        <PortalCard>
          <PortalEmpty
            icon={Mail}
            title="No conversations yet"
            text="Start a new message to begin a conversation."
          >
            <NewMessageButton onClick={() => setIsNewMessageOpen(true)} />
          </PortalEmpty>
        </PortalCard>
      ) : (
        <PortalCard className="flex h-[calc(100vh-220px)] min-h-[520px] flex-col overflow-hidden sm:flex-row">
          {/* Below the sm breakpoint there's only room for one panel at a
              time — show the list OR the open thread (with a back button),
              not both stacked. At sm and up both are visible side by side.
              The mock hides the list outright on a narrow screen; that would
              leave no way to pick a conversation, so it isn't copied. */}
          <div
            className={`${selectedConversation ? "hidden" : "flex"} min-h-0 w-full flex-1 flex-col border-b border-cn-p-line sm:flex sm:w-[300px] sm:flex-none sm:border-b-0 sm:border-r`}
          >
            <ConversationList
              selectedConversationId={selectedConversation?.id}
              onSelectConversation={setSelectedConversation}
              autoSelectConversationId={
                !selectedConversation ? autoSelectConversationId : null
              }
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
      )}

      <NewMessageModal
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onConversationStarted={handleConversationStarted}
      />
    </div>
  );
}

export default function MessagesScreen() {
  return (
    <Suspense fallback={<Loader fullScreen={false} tone="cobalt" label="Loading messages..." />}>
      <MessagesScreenContent />
    </Suspense>
  );
}
